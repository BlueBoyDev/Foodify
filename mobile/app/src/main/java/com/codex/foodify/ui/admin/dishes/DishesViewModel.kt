// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dishes/DishesViewModel.kt
package com.codex.foodify.ui.admin.dishes

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.Dish
import com.codex.foodify.data.model.CreateDishRequest
import com.codex.foodify.data.model.DishCategory
import com.codex.foodify.data.model.InventoryItem
import com.codex.foodify.data.model.RecipeDto
import com.codex.foodify.data.model.RecipeIngredientDto
import com.codex.foodify.data.model.DishWithRecipeDto
import com.codex.foodify.data.model.Menu
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import okhttp3.MultipartBody
import javax.inject.Inject

@HiltViewModel
class DishesViewModel @Inject constructor(
    private val repository: FoodifyRepository,
) : ViewModel() {

    private val _uploadState = MutableLiveData<Result<String>?>()
    val uploadState: LiveData<Result<String>?> = _uploadState

    fun uploadImage(part: MultipartBody.Part) {
        _uploadState.value = Result.Loading
        viewModelScope.launch {
            _uploadState.value = repository.uploadImage(part)
        }
    }

    fun clearUploadState() {
        _uploadState.value = null
    }

    private val _dishes      = MutableLiveData<Result<List<Dish>>>()
    val dishes: LiveData<Result<List<Dish>>> = _dishes

    private val _categories  = MutableLiveData<List<DishCategory>>()
    val categories: LiveData<List<DishCategory>> = _categories

    private val _inventoryItems = MutableLiveData<List<InventoryItem>>()
    val inventoryItems: LiveData<List<InventoryItem>> = _inventoryItems

    private val _actionState = MutableLiveData<Result<Dish>?>()
    val actionState: LiveData<Result<Dish>?> = _actionState

    private val _editingDish = MutableLiveData<Dish?>()
    val editingDish: LiveData<Dish?> = _editingDish

    private val _editingRecipe = MutableLiveData<RecipeDto?>()
    val editingRecipe: LiveData<RecipeDto?> = _editingRecipe

    private val _menus = MutableLiveData<List<Menu>>()
    val menus: LiveData<List<Menu>> = _menus

    // Lista mutable de ingredientes para el formulario
    private val _ingredientList = MutableLiveData<MutableList<RecipeIngredientDto>>(mutableListOf())
    val ingredientList: LiveData<MutableList<RecipeIngredientDto>> = _ingredientList

    private var allDishes = listOf<Dish>()
    private var activeFilter = "Todos"
    private var activeMenuId: Int? = null

    fun loadDishes(search: String? = null) {
        _dishes.value = Result.Loading
        viewModelScope.launch {
            val result = repository.getDishes(search = search)
            if (result is Result.Success) {
                allDishes = result.data
                applyFilter(activeFilter)
            } else {
                _dishes.value = result
            }
        }
    }

    fun loadMenus() {
        viewModelScope.launch {
            val res = repository.getMenus()
            if (res is Result.Success) {
                _menus.value = res.data
            }
        }
    }

    /**
     * Filtra la lista de platillos localmente por nombre de categoría
     */
    fun filterByCategory(categoryName: String) {
        activeFilter = categoryName
        applyFilter(categoryName)
    }

    fun filterByMenu(menuId: Int?) {
        activeMenuId = menuId
        applyFilter(activeFilter)
    }

    private fun applyFilter(categoryName: String) {
        var filteredList = allDishes

        // Filtro por Menú
        if (activeMenuId != null) {
            filteredList = filteredList.filter { it.category?.menuId == activeMenuId }
        }

        // Filtro por Categoría
        if (categoryName != "Todos" && categoryName != "Todas") {
            filteredList = filteredList.filter { dish ->
                val nameFromObj = dish.category?.name
                val nameFromList = categories.value?.find { it.id == dish.categoryId }?.name
                
                nameFromObj?.equals(categoryName, ignoreCase = true) == true ||
                nameFromList?.equals(categoryName, ignoreCase = true) == true ||
                dish.categoryId.toString() == categoryName
            }
        }

        _dishes.value = Result.Success(filteredList)
    }

    fun loadCategories() {
        viewModelScope.launch {
            // Intentamos cargar categorías del menú activo o fallback
            val mId = activeMenuId ?: 1
            val catsResult = repository.getMenuCategories(mId)
            if (catsResult is Result.Success) {
                _categories.value = catsResult.data.map { DishCategory(it.id, it.name, it.menuId) }.distinctBy { it.id }
            }
        }
    }

    /**
     * Carga TODAS las categorías de TODOS los menús para el selector agrupado del formulario
     */
    fun loadAllCategoriesGrouped() {
        viewModelScope.launch {
            val menusRes = repository.getMenus()
            if (menusRes is Result.Success) {
                _menus.value = menusRes.data
                val allCategories = mutableListOf<DishCategory>()
                
                // Cargar categorías de cada menú en paralelo
                val jobs = menusRes.data.map { menu ->
                    async {
                        val res = repository.getMenuCategories(menu.id)
                        if (res is Result.Success) {
                            res.data.map { DishCategory(it.id, it.name, menu.id) }
                        } else emptyList()
                    }
                }
                
                allCategories.addAll(jobs.flatMap { it.await() })
                _categories.value = allCategories.distinctBy { it.id }
            }
        }
    }

    fun loadInventoryItems() {
        viewModelScope.launch {
            val result = repository.getInventoryItems()
            if (result is Result.Success) {
                _inventoryItems.value = result.data
            }
        }
    }

    fun clearActionState() {
        _actionState.value = null
    }

    fun loadDishForEditing(dishId: Int) {
        clearEditingData()
        viewModelScope.launch {
            _actionState.value = Result.Loading
            
            try {
                // Cargar datos del platillo
                val dishResult = repository.getDish(dishId)
                if (dishResult is Result.Success<*>) {
                    _editingDish.value = dishResult.data as? Dish
                }
                
                // Cargar receta (puede fallar si no tiene o el backend devuelve null)
                val recipeResult = repository.getDishRecipe(dishId)
                if (recipeResult is Result.Success && recipeResult.data != null) {
                    val recipe = recipeResult.data
                    _editingRecipe.value = recipe
                    _ingredientList.value = (recipe.ingredients ?: emptyList()).toMutableList()
                } else {
                    // Si no hay receta, dejamos limpiar para que el Dialog lo sepa
                    _editingRecipe.value = null
                    _ingredientList.value = mutableListOf()
                }
            } catch (e: Exception) {
                _actionState.value = Result.Error("Error al cargar datos: ${e.message}")
            } finally {
                // Limpiamos el loading para que el botón se habilite
                _actionState.value = null
            }
        }
    }

    fun addIngredient(ingredient: RecipeIngredientDto) {
        val current = _ingredientList.value ?: mutableListOf()
        current.add(ingredient)
        _ingredientList.value = current
    }

    fun removeIngredient(ingredient: RecipeIngredientDto) {
        val current = _ingredientList.value ?: return
        current.remove(ingredient)
        _ingredientList.value = current
    }

    fun updateIngredient(index: Int, ingredient: RecipeIngredientDto) {
        val current = _ingredientList.value ?: return
        if (index in current.indices) {
            current[index] = ingredient
            _ingredientList.value = current
        }
    }

    fun clearEditingData() {
        _editingDish.value = null
        _editingRecipe.value = null
        _ingredientList.value = mutableListOf()
    }

    fun saveDish(dishId: Int?, req: CreateDishRequest, steps: List<com.codex.foodify.data.model.RecipeStepDto>?) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            try {
                val dishResult = if (dishId != null) {
                    repository.updateDish(dishId, req)
                } else {
                    repository.createDish(req)
                }

                if (dishResult is Result.Success<*>) {
                    val id = (dishResult as Result.Success<Dish>).data.id
                    val ingredients = _ingredientList.value ?: emptyList()
                    
                    if (ingredients.isNotEmpty() || steps != null) {
                        val recipeReq = RecipeDto(
                            id = _editingRecipe.value?.id,
                            dishId = id,
                            prepTimeMin = req.prepTimeMin,
                            servings = 1,
                            steps = steps,
                            notes = null,
                            ingredients = ingredients
                        )
                        val recipeResult = repository.upsertDishRecipe(id, recipeReq)
                        // Verificar que la receta se guardó correctamente
                        if (recipeResult is Result.Error) {
                            _actionState.value = recipeResult
                            return@launch
                        }
                    }
                    
                    loadDishes()
                    _actionState.value = dishResult
                    clearEditingData()
                } else {
                    _actionState.value = dishResult
                }
            } catch (e: Exception) {
                _actionState.value = Result.Error("Error al guardar: ${e.message}")
            }
        }
    }

    fun createDish(req: CreateDishRequest) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            try {
                _actionState.value = repository.createDish(req)
                if (_actionState.value is Result.Success<*>) loadDishes()
            } catch (e: Exception) {
                _actionState.value = Result.Error(e.message ?: "Error fatal")
            }
        }
    }

    fun updateDish(id: Int, req: CreateDishRequest) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            try {
                _actionState.value = repository.updateDish(id, req)
                if (_actionState.value is Result.Success<*>) loadDishes()
            } catch (e: Exception) {
                _actionState.value = Result.Error(e.message ?: "Error fatal")
            }
        }
    }

    fun toggleAvailability(dish: Dish) {
        viewModelScope.launch {
            repository.toggleDishAvailability(dish.id)
            loadDishes()
        }
    }

    fun deleteDish(id: Int) {
        viewModelScope.launch {
            repository.deleteDish(id)
            loadDishes()
        }
    }

    /**
     * Asigna múltiples platillos a una categoría específica (Batch Update)
     */
    fun batchUpdateDishCategory(dishIds: List<Int>, categoryId: Int) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            var successCount = 0
            var errorOccurred = false

            dishIds.forEach { id ->
                val dish = allDishes.find { it.id == id }
                if (dish != null) {
                    val req = CreateDishRequest(
                        name = dish.displayName,
                        price = dish.displayPrice,
                        prepTimeMin = dish.displayTime,
                        description = dish.description,
                        categoryId = categoryId,
                        allergens = dish.allergens,
                        images = dish.images
                    )
                    val res = repository.updateDish(id, req)
                    if (res is Result.Success<*>) successCount++
                    else errorOccurred = true
                }
            }

            if (successCount > 0) {
                loadDishes()
                _actionState.value = Result.Success(allDishes.first()) // Trigger success
            }
            
            if (errorOccurred && successCount == 0) {
                _actionState.value = Result.Error("Error al actualizar platillos")
            }
        }
    }

    /**
     * Quita un platillo de su categoría actual (Unlink del menú)
     */
    fun removeFromCategory(dishId: Int) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val dish = allDishes.find { it.id == dishId }
            if (dish != null) {
                val req = CreateDishRequest(
                    name = dish.displayName,
                    price = dish.displayPrice,
                    prepTimeMin = dish.displayTime,
                    description = dish.description,
                    categoryId = null, // UNLINK
                    allergens = dish.allergens,
                    images = dish.images
                )
                val res = repository.updateDish(dishId, req)
                if (res is Result.Success<*>) {
                    loadDishes()
                }
                _actionState.value = res
            }
        }
    }

    fun resetActionState() {
        _actionState.value = null
    }
}
