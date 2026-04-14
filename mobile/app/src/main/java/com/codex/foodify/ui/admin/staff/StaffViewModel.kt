// RUTA: app/src/main/java/com/codex/foodify/ui/admin/staff/StaffViewModel.kt
// Gestión de empleados — compatible con campos Jorge: nombre, apellido, rol, activo
package com.codex.foodify.ui.admin.staff

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.CreateStaffRequest
import com.codex.foodify.data.model.Staff
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StaffViewModel @Inject constructor(
    private val repository: FoodifyRepository,
) : ViewModel() {

    private val _staff       = MutableLiveData<Result<List<Staff>>>()
    val staff: LiveData<Result<List<Staff>>> = _staff

    private val _actionState = MutableLiveData<Result<Staff>?>()
    val actionState: LiveData<Result<Staff>?> = _actionState

    fun resetActionState() {
        _actionState.value = null
    }

    private var allStaff = listOf<Staff>()
    private var activeRolFilter = "Todos los roles"
    private var activeStatusFilter = "Todos"
    private var activeSearchQuery = ""
    private val deletedIds = mutableSetOf<Int>()

    fun loadStaff() {
        _staff.value = Result.Loading
        viewModelScope.launch {
            val result = repository.getStaff()
            if (result is Result.Success) allStaff = result.data
            applyFilters()
        }
    }

    fun filterByRole(role: String) {
        activeRolFilter = role
        applyFilters()
    }

    fun filterByStatus(status: String) {
        activeStatusFilter = status
        applyFilters()
    }

    fun search(query: String) {
        activeSearchQuery = query
        applyFilters()
    }

    private fun applyFilters() {
        var filtered = allStaff
        if (activeRolFilter != "Todos los roles") {
            filtered = filtered.filter {
                it.displayRole.equals(activeRolFilter, ignoreCase = true)
            }
        }
        // Filtrar localmente los que han sido "borrados" en esta sesión
        filtered = filtered.filter { it.id !in deletedIds }

        // Filtro por búsqueda
        if (activeSearchQuery.isNotEmpty()) {
            filtered = filtered.filter {
                it.displayName.contains(activeSearchQuery, ignoreCase = true) ||
                it.email.contains(activeSearchQuery, ignoreCase = true)
            }
        }

        when (activeStatusFilter) {
            "Activos"   -> filtered = filtered.filter { it.displayActive }
            "Inactivos" -> filtered = filtered.filter { !it.displayActive }
        }
        _staff.value = Result.Success(filtered)
    }

    fun createStaff(req: CreateStaffRequest) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.createStaff(req)
            _actionState.value = result
            if (result is Result.Success) loadStaff()
        }
    }

    fun updateStaff(id: Int, updates: Map<String, Any>) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.updateStaff(id, updates)
            _actionState.value = result
            if (result is Result.Success) loadStaff()
        }
    }

    fun toggleActive(staff: Staff) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val updates = mutableMapOf<String, Any>(
                "isActive" to !staff.displayActive
            )
            val result = repository.updateStaff(staff.id, updates)
            _actionState.value = result
            if (result is Result.Success) loadStaff()
        }
    }

    fun deleteStaff(id: Int) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.deleteStaff(id)
            if (result is Result.Success) {
                deletedIds.add(id) // Marcar como borrado visualmente
                _actionState.value = Result.Success(Staff(id, email = "", isActive = false))
                loadStaff()
            } else {
                _actionState.value = Result.Error((result as Result.Error).message ?: "Error al eliminar")
            }
        }
    }
}
