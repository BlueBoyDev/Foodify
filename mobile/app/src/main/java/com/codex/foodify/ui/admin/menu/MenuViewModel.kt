// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/MenuViewModel.kt
package com.codex.foodify.ui.admin.menu

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.Menu
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MenuViewModel @Inject constructor(
    private val repository: FoodifyRepository
) : ViewModel() {

    private val _menus = MutableLiveData<Result<List<Menu>>>()
    val menus: LiveData<Result<List<Menu>>> = _menus

    private val _operationState = MutableLiveData<Result<Unit>?>()
    val operationState: LiveData<Result<Unit>?> = _operationState

    fun loadMenus() {
        _menus.value = Result.Loading
        viewModelScope.launch {
            _menus.value = repository.getMenus()
        }
    }

    fun updateMenuStatus(id: Int, isActive: Boolean) {
        viewModelScope.launch {
            repository.updateMenuStatus(id, isActive)
            loadMenus()
        }
    }

    fun deleteMenu(id: Int) {
        _operationState.value = Result.Loading
        viewModelScope.launch {
            val res = repository.deleteMenu(id)
            _operationState.value = res
            if (res is Result.Success) loadMenus()
        }
    }

    fun createMenu(request: com.codex.foodify.data.model.CreateMenuRequest) {
        _operationState.value = Result.Loading
        viewModelScope.launch {
            val res = repository.createMenu(request)
            _operationState.value = if (res is Result.Success) Result.Success<Unit>(Unit) else Result.Error((res as Result.Error).message)
            if (res is Result.Success) loadMenus()
        }
    }

    fun updateMenu(id: Int, request: com.codex.foodify.data.model.CreateMenuRequest) {
        _operationState.value = Result.Loading
        viewModelScope.launch {
            val res = repository.updateMenu(id, request)
            _operationState.value = if (res is Result.Success) Result.Success<Unit>(Unit) else Result.Error((res as Result.Error).message)
            if (res is Result.Success) loadMenus()
        }
    }

    fun clearOperationState() {
        _operationState.value = null
    }
}
