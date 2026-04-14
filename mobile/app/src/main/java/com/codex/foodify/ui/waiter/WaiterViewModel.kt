// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/WaiterViewModel.kt
// ViewModel compartido entre todos los fragmentos del Mesero
package com.codex.foodify.ui.waiter

import androidx.lifecycle.LiveData
import androidx.lifecycle.MediatorLiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.Order
import com.codex.foodify.data.model.OrderDto
import com.codex.foodify.data.model.Table
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject
import com.codex.foodify.data.model.Dish
import com.codex.foodify.data.model.DishCategory

@HiltViewModel
class WaiterViewModel @Inject constructor(
    private val repository: FoodifyRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _tables       = MutableLiveData<Result<List<Table>>>()
    val tables: LiveData<Result<List<Table>>> = _tables

    private val _activeOrders = MutableLiveData<Result<List<Order>>>()
    val activeOrders: LiveData<Result<List<Order>>> = _activeOrders

    private val _actionState  = MutableLiveData<Result<Any>>()
    val actionState: LiveData<Result<Any>> = _actionState

    // KPIs del panel de inicio (imagen 12)
    val pendingOrders  = MutableLiveData(0)
    val completedToday = MutableLiveData(0)
    val inKitchen      = MutableLiveData(0)
    val salesToday     = MutableLiveData(0.0)
    private var isClearing      = false

    private val _loggedUserName = MutableLiveData<String>()
    val loggedUserName: LiveData<String> = _loggedUserName

    private val _dishes = MutableLiveData<Result<List<Dish>>>()
    val dishes: LiveData<Result<List<Dish>>> = _dishes

    private val _categories = MutableLiveData<Result<List<DishCategory>>>()
    val categories: LiveData<Result<List<DishCategory>>> = _categories

    fun loadAll() {
        viewModelScope.launch {
            authRepository.userName.collect { name ->
                _loggedUserName.value = name ?: "Usuario"
            }
        }
        loadTables()
        loadActiveOrders()
        loadMenu()
    }

    fun loadMenu() {
        if (isClearing) return
        viewModelScope.launch {
            _dishes.value = Result.Loading
            _categories.value = Result.Loading
            
            // 1. Cargar platillos
            val dishesResult = repository.getDishes()
            _dishes.value = dishesResult
            
            // 2. Cargar menús para obtener categorías de todas las fuentes posibles
            val menusResult = repository.getMenus()
            val allCategories = mutableSetOf<DishCategory>()
            
            if (menusResult is Result.Success) {
                // Escanear todos los menús para encontrar categorías
                menusResult.data.forEach { menu ->
                    val catRes = repository.getMenuCategories(menu.id)
                    if (catRes is Result.Success) {
                        // Mapear Category a DishCategory para mantener compatibilidad
                        allCategories.addAll(catRes.data.map { 
                            DishCategory(it.id, it.name, it.menuId) 
                        })
                    }
                }
            }
            
            // 3. Extraer categorías directamente de los platillos cargados (fallback de respaldo)
            if (dishesResult is Result.Success) {
                dishesResult.data.forEach { dish ->
                    dish.category?.let { allCategories.add(it) }
                }
            }
            
            // 4. Actualizar con la lista consolidada, eliminando duplicados y ordenando
            val finalCategories = allCategories.toList().distinctBy { it.id }.sortedBy { it.name }
            _categories.value = Result.Success(finalCategories)
        }
    }

    fun loadTables() {
        if (isClearing) return
        viewModelScope.launch {
            _tables.value = Result.Loading
            _tables.value = repository.getTables()
        }
    }

    fun loadActiveOrders() {
        if (isClearing) return
        viewModelScope.launch {
            _activeOrders.value = Result.Loading
            val result = repository.getActiveOrders()
            val allOrdersResult = repository.getAllOrdersDto()

            _activeOrders.value = result
            if (result is Result.Success) {
                pendingOrders.value  = result.data.count { it.status == "pending" }
                inKitchen.value      = result.data.count { it.kitchenStatus == "preparing" }
                
                if (allOrdersResult is Result.Success) {
                    val validOrders = allOrdersResult.data.filter { it.status != "cancelled" && it.status != "rejected" }
                    val deliveredToday = validOrders.filter { it.status == "delivered" || it.status == "paid" }
                    completedToday.value = deliveredToday.size
                    salesToday.value     = validOrders.sumOf { it.total }
                } else {
                    completedToday.value = result.data.count { it.status == "delivered" }
                    salesToday.value     = result.data.filter { it.status != "cancelled" && it.status != "rejected" }.sumOf { it.total }
                }
            }
        }
    }

    fun updateTableStatus(tableId: Int, status: String) {
        viewModelScope.launch {
            repository.updateTableStatus(tableId, status)
            loadTables()
        }
    }

    fun markAsDelivered(orderId: Int) {
        viewModelScope.launch {
            _actionState.value = repository.updateOrderStatus(orderId, "delivered")
            loadActiveOrders()
            loadTables()
        }
    }

    fun scanQr(orderId: Int) {
        viewModelScope.launch {
            _actionState.value = repository.scanQr(orderId)
        }
    }

    // ─── Gestión de Pedidos DTO (WaiterOrdersFragment) ──────────────
    private val _allOrders = MutableLiveData<List<OrderDto>>(emptyList())
    private val _activeFilter = MutableLiveData("Todos")
    private val _ordersLoading = MutableLiveData(false)
    private val _ordersError = MutableLiveData<String?>(null)

    val filteredOrders: LiveData<List<OrderDto>> = MediatorLiveData<List<OrderDto>>().apply {
        fun update() {
            val orders = _allOrders.value ?: emptyList()
            value = when (_activeFilter.value) {
                "Nuevos"     -> orders.filter { it.status == "pending" }
                "Cocina"     -> orders.filter { 
                    it.status == "preparing" || it.kitchenStatus == "preparing" 
                }
                "Listos"     -> orders.filter { it.kitchenStatus == "ready" }
                "Entregados" -> orders.filter { it.status == "delivered" }
                else         -> orders
            }
        }
        addSource(_allOrders) { update() }
        addSource(_activeFilter) { update() }
    }

    val ordersLoading: LiveData<Boolean> = _ordersLoading
    val ordersError: LiveData<String?> = _ordersError

    fun setOrderFilter(filter: String) {
        _activeFilter.value = filter
    }

    fun loadOrders() {
        if (isClearing) return
        viewModelScope.launch {
            _ordersLoading.value = true
            _ordersError.value = null
            repository.getAllOrdersDto()
                .onSuccess { orders -> _allOrders.value = orders }
                .onFailure { error -> _ordersError.value = error.message }
            _ordersLoading.value = false
        }
    }

    fun scanQrOrder(orderId: Int, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            repository.scanOrderQr(orderId)
                .onSuccess { resp ->
                    loadOrders() // recargar lista
                    onResult(true, "Orden #${resp.orderNumber} entregada — $${resp.total}")
                }
                .onFailure { error -> onResult(false, error.message ?: "Error al procesar QR") }
        }
    }

    fun claimOrder(orderId: Int, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            repository.claimOrderDto(orderId)
                .onSuccess { order ->
                    loadOrders()
                    onResult(true, "Orden #${order.orderNumber} reclamada con éxito")
                }
                .onFailure { error -> 
                    onResult(false, error.message ?: "Error al reclamar orden")
                }
        }
    }

    fun logout(onComplete: () -> Unit) {
        isClearing = true
        // Limpiar datos locales
        _allOrders.value = emptyList()
        _tables.value = Result.Success(emptyList())
        _activeOrders.value = Result.Success(emptyList())
        viewModelScope.launch {
            authRepository.logout()
            onComplete()
        }
    }

    // Actualizar en tiempo real desde WebSocket
    fun updateOrderFromWebSocket(
        orderId: Int, 
        newStatus: String? = null, 
        kitchenStatus: String? = null,
        waiterName: String? = null
    ) {
        val current = _allOrders.value?.toMutableList() ?: return
        val index = current.indexOfFirst { it.id == orderId }
        if (index != -1) {
            current[index] = current[index].copy(
                status = newStatus ?: current[index].status,
                kitchenStatus = kitchenStatus ?: current[index].kitchenStatus,
                waiterName = waiterName ?: current[index].waiterName
            )
            _allOrders.value = current
        }
    }
}
