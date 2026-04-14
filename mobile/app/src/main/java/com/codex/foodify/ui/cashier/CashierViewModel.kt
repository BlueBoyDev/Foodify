// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierViewModel.kt
package com.codex.foodify.ui.cashier

import androidx.lifecycle.LiveData
import androidx.lifecycle.MediatorLiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.OrderDto
import com.codex.foodify.data.model.OrderItemDto
import com.codex.foodify.data.model.ScanQrResponse
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import javax.inject.Inject

// KPIs calculados del lado cliente
data class CashierKpis(
    val takeoutPending: Int,
    val tablePending: Int,
    val completedToday: Int,
    val salesToday: Double,
    val readyToDeliver: Int
)

@HiltViewModel
class CashierViewModel @Inject constructor(
    private val repository: FoodifyRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    // ── Estado general ──────────────────────────────
    private val _activeOrders  = MutableLiveData<List<OrderDto>>(emptyList())
    private val _allOrders     = MutableLiveData<List<OrderDto>>(emptyList())
    private val _kpis          = MutableLiveData<CashierKpis>()
    private val _isLoading     = MutableLiveData(false)
    private val _error         = MutableLiveData<String?>(null)
    private val _successMsg    = MutableLiveData<String?>(null)
    private var isClearing      = false

    val kpis:        LiveData<CashierKpis>    = _kpis
    val isLoading:   LiveData<Boolean>        = _isLoading
    val error:       LiveData<String?>        = _error
    val successMsg:  LiveData<String?>        = _successMsg

    private val _loggedUserName = MutableLiveData<String>()
    val loggedUserName: LiveData<String> = _loggedUserName

    init {
        viewModelScope.launch {
            authRepository.userName.collect { name ->
                _loggedUserName.postValue(name ?: "Cajero")
            }
        }
    }

    // ── Pedidos listos para home ─────────────────────
    val readyOrders: LiveData<List<OrderDto>> = MediatorLiveData<List<OrderDto>>().apply {
        addSource(_activeOrders) { orders ->
            value = orders.filter { it.isReady() }
        }
    }

    // ── Filtro para pantalla Pedidos ─────────────────
    private val _activeFilter  = MutableLiveData("Todos")
    val activeFilter: LiveData<String> = _activeFilter

    val filteredOrders: LiveData<List<OrderDto>> = 
        MediatorLiveData<List<OrderDto>>().apply {
            fun update() {
                val orders = _activeOrders.value ?: emptyList()
                value = when (_activeFilter.value) {
                    "Para Llevar" -> orders.filter { it.isTakeout() }
                    "En Mesa"     -> orders.filter { it.isDineIn() }
                    "Listos"      -> orders.filter { it.isReady() }
                    else          -> orders
                }
            }
            addSource(_activeOrders)  { update() }
            addSource(_activeFilter)  { update() }
        }

    // ── Historial ────────────────────────────────────
    private val _historyFilter = MutableLiveData("Entregados")
    val historyFilter: LiveData<String> = _historyFilter

    val historyOrders: LiveData<List<OrderDto>> = 
        MediatorLiveData<List<OrderDto>>().apply {
            fun update() {
                val orders = _allOrders.value ?: emptyList()
                value = when (_historyFilter.value) {
                    "Cancelados" -> orders.filter { it.status == "cancelled" }
                    else         -> orders.filter { it.status == "delivered" }
                }
            }
            addSource(_allOrders)      { update() }
            addSource(_historyFilter)  { update() }
        }

    // ════════════════════════════════════════
    // FUNCIONES DE CARGA
    // ════════════════════════════════════════

    fun loadData() {
        if (isClearing) return
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null

            // Carga paralela de pedidos activos y todos los de hoy
            val activeJob = async { repository.getActiveOrdersDto() }
            val allJob    = async { repository.getAllOrdersDto() }

            activeJob.await()
                .onSuccess { _activeOrders.value = it }
                .onFailure { _error.value = "Error cargando pedidos: ${it.message}" }

            allJob.await()
                .onSuccess {
                    _allOrders.value = it
                    // Calcular KPIs
                    val active = _activeOrders.value ?: emptyList()
                    _kpis.value = calculateCashierKpis(active, it)
                }
                .onFailure { /* KPIs solo con activos */ }

            _isLoading.value = false
        }
    }

    fun logout(onComplete: () -> Unit) {
        isClearing = true
        clearData()
        viewModelScope.launch {
            authRepository.logout()
            onComplete()
        }
    }

    fun clearData() {
        _activeOrders.value = emptyList()
        _allOrders.value = emptyList()
        _error.value = null
        _isLoading.value = false
    }

    fun setOrderFilter(filter: String)   { _activeFilter.value  = filter }
    fun setHistoryFilter(filter: String) { _historyFilter.value = filter }

    // ════════════════════════════════════════
    // MARCAR COMO ENTREGADO (con validación)
    // ════════════════════════════════════════

    fun deliverOrder(
        order: OrderDto, 
        onValidationError: (String) -> Unit,
        onSuccess: (OrderDto) -> Unit
    ) {
        // La validación de estado "Listo" ahora se maneja en la UI
        // mediante un diálogo de confirmación inteligente.
        
        viewModelScope.launch {
            _isLoading.value = true
            repository.updateOrderStatusDto(order.id, mapOf("status" to "delivered"))
                .onSuccess { updatedOrder ->
                    // Remover de activos, agregar a historial
                    _activeOrders.value = _activeOrders.value
                        ?.filter { it.id != order.id }
                    _allOrders.value = _allOrders.value?.map {
                        if (it.id == order.id) updatedOrder else it
                    }
                    // Recalcular KPIs
                    val active = _activeOrders.value ?: emptyList()
                    val all    = _allOrders.value    ?: emptyList()
                    _kpis.value = calculateCashierKpis(active, all)
                    
                    _successMsg.value = 
                        "✅ ${order.getDisplaySource()} · " +
                        "Folio #${order.orderNumber} entregado"
                    onSuccess(updatedOrder)
                }
                .onFailure { 
                    _error.value = "Error al marcar como entregado: ${it.message}" 
                }
            _isLoading.value = false
        }
    }

    // ════════════════════════════════════════
    // ESCANEAR QR (con validación)
    // ════════════════════════════════════════

    fun processQrScan(
        qrContent: String,
        onValidationError: (String) -> Unit,
        onSuccess: (ScanQrResponse, OrderDto?) -> Unit
    ) {
        viewModelScope.launch {
            // Parsear orderId del QR
            // El QR puede contener: "pedido-5" o solo "5" o el orderNumber "0023"
            val orderId = parseOrderIdFromQr(qrContent)
            if (orderId == null) {
                onValidationError("QR inválido. No se pudo identificar la orden.")
                return@launch
            }

            // Obtener la orden del backend para validar
            _isLoading.value = true
            repository.getOrderByIdDto(orderId)
                .onSuccess { order ->
                    // VALIDACIÓN 1: debe ser Para Llevar
                    if (!order.isTakeout()) {
                        onValidationError(
                            "Este QR corresponde a una orden en mesa. " +
                            "Solo las órdenes Para Llevar se entregan por QR."
                        )
                        _isLoading.value = false
                        return@onSuccess
                    }
                    // VALIDACIÓN 2: debe estar lista
                    if (!order.isReady()) {
                        onValidationError(
                            "La orden #${order.orderNumber} aún no está lista.\n" +
                            "Estado: ${order.getDisplayStatus().uppercase()}\n" +
                            "Espera a que cocina marque la orden como lista."
                        )
                        _isLoading.value = false
                        return@onSuccess
                    }
                    // VALIDACIÓN 3: no debe estar ya entregada
                    if (order.status == "delivered") {
                        onValidationError(
                            "La orden #${order.orderNumber} ya fue entregada anteriormente."
                        )
                        _isLoading.value = false
                        return@onSuccess
                    }

                    // Todo ok → proceder con scan-qr
                    repository.scanOrderQr(orderId)
                        .onSuccess { scanResult ->
                            // Actualizar listas locales
                            _activeOrders.value = _activeOrders.value
                                ?.filter { it.id != orderId }
                            val updatedOrder = order.copy(status = "delivered")
                            _allOrders.value = _allOrders.value?.map {
                                if (it.id == orderId) updatedOrder else it
                            }
                            val active = _activeOrders.value ?: emptyList()
                            val all    = _allOrders.value    ?: emptyList()
                            _kpis.value = calculateCashierKpis(active, all)
                            
                            onSuccess(scanResult, order)
                        }
                        .onFailure { 
                            onValidationError("Error al procesar QR: ${it.message}") 
                        }
                }
                .onFailure { 
                    onValidationError("No se encontró la orden. Verifica el QR.") 
                }
            _isLoading.value = false
        }
    }

    private fun parseOrderIdFromQr(content: String): Int? {
        // Formatos posibles: "pedido-5", "order-5", "5", "0005"
        return content.removePrefix("pedido-")
                      .removePrefix("order-")
                      .trimStart('0')
                      .toIntOrNull()
            ?: content.toIntOrNull()
    }

    fun clearMessages() {
        _error.value = null
        _successMsg.value = null
    }

    // ════════════════════════════════════════
    // UTILIDADES
    // ════════════════════════════════════════

    private fun calculateCashierKpis(
        activeOrders: List<OrderDto>, 
        allTodayOrders: List<OrderDto>
    ): CashierKpis {
        return CashierKpis(
            takeoutPending  = activeOrders.count { 
                it.isTakeout() && !it.isReady() 
            },
            tablePending    = activeOrders.count { 
                it.isDineIn() && !it.isReady() 
            },
            completedToday  = allTodayOrders.count { 
                it.status == "delivered" 
            },
            salesToday      = allTodayOrders
                .filter { it.status == "delivered" }
                .sumOf { it.total },
            readyToDeliver  = activeOrders.count { it.isReady() }
        )
    }
}
