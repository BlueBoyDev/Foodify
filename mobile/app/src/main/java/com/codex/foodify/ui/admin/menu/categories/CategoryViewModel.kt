// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/CategoryViewModel.kt
package com.codex.foodify.ui.admin.menu.categories

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.*
import com.codex.foodify.data.repository.CategoryRepository
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CategoryViewModel @Inject constructor(
    private val repository: CategoryRepository,
    private val foodifyRepository: FoodifyRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CategoriesUiState>(CategoriesUiState.Loading)
    val uiState: StateFlow<CategoriesUiState> = _uiState.asStateFlow()

    private val _operationState = MutableStateFlow<CategoryOperationState>(CategoryOperationState.Idle)
    val operationState: StateFlow<CategoryOperationState> = _operationState.asStateFlow()

    private val _availableMenus = MutableStateFlow<List<Menu>>(emptyList())
    val availableMenus: StateFlow<List<Menu>> = _availableMenus.asStateFlow()

    // Lista local mutable para updates optimistas
    private var currentCategories = mutableListOf<Category>()

    private var currentMenuId: Int = -1

    fun loadCategories(menuId: Int) {
        currentMenuId = menuId
        if (menuId == -1) {
            loadAllCategories()
            return
        }
        _uiState.value = CategoriesUiState.Loading
        viewModelScope.launch {
            val result = repository.getCategories(menuId)
            when (result) {
                is Result.Success -> {
                    currentCategories = result.data.sortedBy { it.sortOrder }.toMutableList()
                    updateUiWithCurrent()
                }
                is Result.Error -> {
                    _uiState.value = CategoriesUiState.Error(
                        result.message ?: "Error al cargar las categorías"
                    )
                }
                is Result.Loading -> _uiState.value = CategoriesUiState.Loading
                else -> {}
            }
        }
    }

    private fun loadAllCategories() {
        _uiState.value = CategoriesUiState.Loading
        viewModelScope.launch {
            val menusRes = foodifyRepository.getMenus()
            if (menusRes is Result.Success) {
                val menus = menusRes.data
                _availableMenus.value = menus // Guardamos para el selector
                
                val allCategories = mutableListOf<Category>()
                menus.forEach { menu ->
                    val res = repository.getCategories(menu.id)
                    if (res is Result.Success) {
                        allCategories.addAll(res.data)
                    }
                }
                // Filtramos por ID único por si acaso
                currentCategories = allCategories.distinctBy { it.id }.sortedBy { it.name }.toMutableList()
                updateUiWithCurrent()
            } else if (menusRes is Result.Error) {
                _uiState.value = CategoriesUiState.Error(menusRes.message ?: "Error al cargar menús")
            }
        }
    }

    private fun updateUiWithCurrent() {
        if (currentCategories.isEmpty()) {
            _uiState.value = CategoriesUiState.Empty
        } else {
            _uiState.value = CategoriesUiState.Success(currentCategories.toList())
        }
    }

    fun filterCategories(query: String) {
        if (query.isBlank()) {
            _uiState.value = if (currentCategories.isEmpty()) {
                CategoriesUiState.Empty
            } else {
                CategoriesUiState.Success(currentCategories.toList())
            }
            return
        }
        val filtered = currentCategories.filter {
            it.name.contains(query, ignoreCase = true) ||
            it.description?.contains(query, ignoreCase = true) == true
        }
        _uiState.value = if (filtered.isEmpty()) {
            CategoriesUiState.Empty
        } else {
            CategoriesUiState.Success(filtered)
        }
    }

    fun createCategory(request: CreateCategoryRequest, targetMenuId: Int? = null) {
        val menuIdToUse = targetMenuId ?: currentMenuId
        if (menuIdToUse == -1) {
            _operationState.value = CategoryOperationState.Error("Debes seleccionar un menú")
            return
        }
        
        _operationState.value = CategoryOperationState.Loading
        viewModelScope.launch {
            val result = repository.createCategory(menuIdToUse, request)
            when (result) {
                is Result.Success -> {
                    currentCategories.add(result.data)
                    currentCategories.sortBy { it.sortOrder }
                    _uiState.value = CategoriesUiState.Success(currentCategories.toList())
                    _operationState.value = CategoryOperationState.Success
                }
                is Result.Error -> {
                    _operationState.value = CategoryOperationState.Error(
                        result.message ?: "Error al crear la categoría"
                    )
                }
                else -> {}
            }
        }
    }

    fun updateCategory(categoryId: Int, request: UpdateCategoryRequest) {
        _operationState.value = CategoryOperationState.Loading
        viewModelScope.launch {
            val result = repository.updateCategory(currentMenuId, categoryId, request)
            when (result) {
                is Result.Success -> {
                    val index = currentCategories.indexOfFirst { it.id == categoryId }
                    if (index != -1) {
                        currentCategories[index] = result.data
                        currentCategories.sortBy { it.sortOrder }
                        _uiState.value = CategoriesUiState.Success(currentCategories.toList())
                    }
                    _operationState.value = CategoryOperationState.Success
                }
                is Result.Error -> {
                    _operationState.value = CategoryOperationState.Error(
                        result.message ?: "Error al actualizar la categoría"
                    )
                }
                else -> {}
            }
        }
    }

    // Actualización optimista: mueve visualmente primero, confirma con API después
    fun moveCategoryUp(categoryId: Int) {
        val index = currentCategories.indexOfFirst { it.id == categoryId }
        if (index <= 0) return  // Ya está primera, no hace nada

        // Intercambiar sort_order con la categoría anterior
        val currentItem = currentCategories[index]
        val previousItem = currentCategories[index - 1]

        // Update optimista en lista local
        currentCategories[index] = currentItem.copy(sortOrder = previousItem.sortOrder)
        currentCategories[index - 1] = previousItem.copy(sortOrder = currentItem.sortOrder)
        currentCategories.sortBy { it.sortOrder }
        _uiState.value = CategoriesUiState.Success(currentCategories.toList())

        // Confirmar con API
        viewModelScope.launch {
            val result = repository.updateSortOrder(
                currentMenuId,
                categoryId,
                previousItem.sortOrder
            )
            if (result is Result.Error) {
                // Revertir si falla
                loadCategories(currentMenuId)
            }
        }
    }

    fun moveCategoryDown(categoryId: Int) {
        val index = currentCategories.indexOfFirst { it.id == categoryId }
        if (index == -1 || index >= currentCategories.size - 1) return  // Ya está última

        val currentItem = currentCategories[index]
        val nextItem = currentCategories[index + 1]

        // Update optimista
        currentCategories[index] = currentItem.copy(sortOrder = nextItem.sortOrder)
        currentCategories[index + 1] = nextItem.copy(sortOrder = currentItem.sortOrder)
        currentCategories.sortBy { it.sortOrder }
        _uiState.value = CategoriesUiState.Success(currentCategories.toList())

        // Confirmar con API
        viewModelScope.launch {
            val result = repository.updateSortOrder(
                currentMenuId,
                categoryId,
                nextItem.sortOrder
            )
            if (result is Result.Error) {
                loadCategories(currentMenuId)
            }
        }
    }

    /**
     * Reordenamiento por Drag & Drop
     */
    fun onMove(fromPosition: Int, toPosition: Int) {
        if (fromPosition < 0 || fromPosition >= currentCategories.size || 
            toPosition < 0 || toPosition >= currentCategories.size) return

        // Mover localmente
        val item = currentCategories.removeAt(fromPosition)
        currentCategories.add(toPosition, item)
        
        // Recalcular sortOrder para todos en el rango afectado o todos
        // Para simplificar y asegurar consistencia, reasignamos todos del 1 al N
        currentCategories.forEachIndexed { index, category ->
            currentCategories[index] = category.copy(sortOrder = index + 1)
        }
        
        _uiState.value = CategoriesUiState.Success(currentCategories.toList())

        // Sincronizar con el servidor (Batch update if possible, or sequential)
        // Por ahora, sincronizamos solo el elemento movido para no saturar
        val movedItem = currentCategories[toPosition]
        viewModelScope.launch {
            repository.updateSortOrder(currentMenuId, movedItem.id, movedItem.sortOrder)
        }
    }

    fun deleteCategory(categoryId: Int) {
        _operationState.value = CategoryOperationState.Loading
        viewModelScope.launch {
            val result = repository.deleteCategory(currentMenuId, categoryId)
            when (result) {
                is Result.Success -> {
                    currentCategories.removeAll { it.id == categoryId }
                    _uiState.value = if (currentCategories.isEmpty()) {
                        CategoriesUiState.Empty
                    } else {
                        CategoriesUiState.Success(currentCategories.toList())
                    }
                    _operationState.value = CategoryOperationState.Success
                }
                is Result.Error -> {
                    _operationState.value = CategoryOperationState.Error(
                        result.message ?: "Error al eliminar la categoría"
                    )
                }
                else -> {}
            }
        }
    }

    fun resetOperationState() {
        _operationState.value = CategoryOperationState.Idle
    }

    // Retorna el total actual de categorías para pre-calcular el sort_order del formulario
    fun getNextSortOrder(): Int = currentCategories.size + 1
}
