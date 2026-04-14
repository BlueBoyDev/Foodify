// RUTA: app/src/main/java/com/codex/foodify/ui/admin/inventory/InventoryViewModel.kt
package com.codex.foodify.ui.admin.inventory

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.*
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class InventoryViewModel @Inject constructor(
    private val repository: FoodifyRepository,
) : ViewModel() {

    private val _lots        = MutableLiveData<Result<List<IngredientGroup>>>()
    val lots: LiveData<Result<List<IngredientGroup>>> = _lots

    private val _items       = MutableLiveData<Result<List<InventoryItem>>>()
    val items: LiveData<Result<List<InventoryItem>>> = _items

    private val _alerts      = MutableLiveData<List<InventoryAlert>>()
    val alerts: LiveData<List<InventoryAlert>> = _alerts

    private val _actionState = MutableLiveData<Result<Any>>()
    val actionState: LiveData<Result<Any>> = _actionState

    private var allGroups = listOf<IngredientGroup>()
    private var currentFilter = "Todos"
    private var currentQuery  = ""

    fun loadLots(expiringSoon: Boolean? = null) {
        _lots.value = Result.Loading
        viewModelScope.launch {
            val result = repository.getInventoryLots(expiringSoon = expiringSoon)
            if (result is Result.Success) {
                allGroups = groupLots(result.data)
                _lots.value = Result.Success(allGroups)
            } else if (result is Result.Error) {
                _lots.value = Result.Error(result.message)
            }
        }
    }

    private fun groupLots(lots: List<InventoryLot>): List<IngredientGroup> {
        return lots.groupBy { it.item?.name ?: "Insumo #${it.itemId}" }
            .map { (name, lotList) ->
                val firstLot = lotList.first()
                IngredientGroup(
                    itemName = name,
                    unit = firstLot.item?.unit ?: "u",
                    category = firstLot.item?.category,
                    totalRemaining = lotList.sumOf { it.remaining },
                    lots = lotList.sortedBy { it.expiryDate ?: "9999-12-31" },
                    status = determineGroupStatus(lotList)
                )
            }
            .sortedBy { it.itemName }
    }

    private fun determineGroupStatus(lots: List<InventoryLot>): String {
        return if (lots.any { it.calculatedStatus == "expired" }) "expired"
        else if (lots.any { it.calculatedStatus == "low" }) "low"
        else if (lots.any { it.calculatedStatus == "critical" }) "critical"
        else if (lots.all { it.calculatedStatus == "depleted" }) "depleted"
        else "available"
    }

    fun filterByStatus(status: String) {
        currentFilter = status
        applyFilters()
    }

    fun search(query: String) {
        currentQuery = query
        applyFilters()
    }

    private fun applyFilters() {
        val baseFiltered = when (currentFilter) {
            "Todos"               -> allGroups
            "Disponible"          -> allGroups.filter { it.status == "available" }
            "Próx. a caducar"     -> allGroups.filter { it.status == "low" }
            "Caducado"            -> allGroups.filter { it.status == "expired" }
            "Sin stock"           -> allGroups.filter { it.status == "depleted" }
            else                  -> allGroups
        }

        val finalFiltered = if (currentQuery.isEmpty()) {
            baseFiltered
        } else {
            baseFiltered.filter { it.itemName.contains(currentQuery, ignoreCase = true) }
        }
        
        _lots.value = Result.Success(finalFiltered)
    }

    fun loadItems() {
        viewModelScope.launch {
            _items.value = repository.getInventoryItems()
        }
    }

    fun loadAlerts() {
        viewModelScope.launch {
            val result = repository.getInventoryAlerts()
            if (result is Result.Success) _alerts.value = result.data
        }
    }

    fun createLot(req: CreateLotRequest) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.createLot(req)
            _actionState.value = result
            if (result is Result.Success) {
                loadLots()
                loadItems()
            }
        }
    }

    // Nuevo método para soportar la creación de lotes con nombre de ingrediente directo
    fun createLotLegacy(req: Map<String, Any?>) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.createLotLegacy(req)
            _actionState.value = result
            if (result is Result.Success) {
                loadLots()
                loadItems()
            }
        }
    }

    fun adjustStock(lotId: Int, quantity: Double, notes: String?) {
        viewModelScope.launch {
            val result = repository.createAdjustment(lotId, quantity, notes)
            if (result is Result.Success) loadLots()
        }
    }

    fun updateLot(id: Int, req: Map<String, Any?>) {
        _actionState.value = Result.Loading
        viewModelScope.launch {
            val result = repository.updateLot(id, req)
            _actionState.value = result
            if (result is Result.Success) {
                loadLots()
                loadItems()
            }
        }
    }

    fun deleteLot(id: Int) {
        viewModelScope.launch {
            val result = repository.deleteLot(id)
            if (result is Result.Success) loadLots()
        }
    }

    fun resolveAlert(id: Int) {
        viewModelScope.launch {
            repository.resolveAlert(id)
            loadAlerts()
        }
    }

    fun resetActionState() {
        _actionState.value = null
    }
}
