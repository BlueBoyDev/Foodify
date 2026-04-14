package com.codex.foodify.ui.chef

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.KitchenOrderDto
import com.codex.foodify.data.model.KitchenStatsDto
import com.codex.foodify.data.model.KitchenSessionDto
import com.codex.foodify.data.model.RecipeDto
import com.codex.foodify.data.model.DishWithRecipeDto
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class KitchenViewModel @Inject constructor(
    private val repository: FoodifyRepository,
    private val authRepository: com.codex.foodify.data.repository.AuthRepository
) : ViewModel() {


    private val _orders = MutableLiveData<Result<List<KitchenOrderDto>>>()
    val orders: LiveData<Result<List<KitchenOrderDto>>> = _orders

    private val _stats = MutableLiveData<Result<KitchenStatsDto>>()
    val stats: LiveData<Result<KitchenStatsDto>> = _stats

    private val _dishes = MutableLiveData<Result<List<DishWithRecipeDto>>>()
    val dishes: LiveData<Result<List<DishWithRecipeDto>>> = _dishes

    private val _currentRecipe = MutableLiveData<Result<RecipeDto>>()
    val currentRecipe: LiveData<Result<RecipeDto>> = _currentRecipe

    private val _historyOrders = MutableLiveData<Result<List<KitchenOrderDto>>>()
    val historyOrders: LiveData<Result<List<KitchenOrderDto>>> = _historyOrders

    private val _session = MutableLiveData<KitchenSessionDto?>()
    val session: LiveData<KitchenSessionDto?> = _session

    private val _loggedUserName = MutableLiveData<String>()
    val loggedUserName: LiveData<String> = _loggedUserName

    init {
        viewModelScope.launch {
            authRepository.userName.collect { name ->
                _loggedUserName.value = name ?: "Chef"
            }
        }
    }

    // Contexto para mostrar la receta
    var clickedDishName: String? = null
    var clickedDishImages: List<String>? = null

    private var pollingJob: Job? = null

    fun startPolling() {
        pollingJob?.cancel()
        pollingJob = viewModelScope.launch {
            while (isActive) {
                refreshData()
                delay(15000L) // Reducido a 15 segundos para mayor fluidez
            }
        }
    }

    fun stopPolling() {
        pollingJob?.cancel()
    }

    fun loadOrders() {
        refreshData()
    }

    fun refreshData() {
        viewModelScope.launch {
            val ordersResult = repository.getKitchenOrders()
            val sortedResult = if (ordersResult is Result.Success) {
                Result.Success(ordersResult.data.sortedByDescending { it.id })
            } else {
                ordersResult
            }
            // Usamos postValue para asegurar consistencia en las actualizaciones de UI
            _orders.postValue(sortedResult)
            
            val statsResult = repository.getKitchenStats()
            _stats.postValue(statsResult)
            if (statsResult is Result.Success) {
                _session.postValue(statsResult.data.activeSession)
            }
        }
    }

    /**
     * Remueve una orden de la lista de órdenes activas (comandas) en tiempo real.
     * Llamado cuando llega un evento de WebSocket 'order:finalized'.
     */
    fun removeOrderById(orderId: Int) {
        val currentResult = _orders.value
        if (currentResult is Result.Success) {
            val updatedList = currentResult.data.filter { it.id != orderId }
            _orders.postValue(Result.Success(updatedList))
        }
    }

    fun loadHistory(date: String? = null) {
        viewModelScope.launch {
            _historyOrders.value = Result.Loading
            _historyOrders.value = repository.getKitchenHistory(date)
        }
    }

    fun archiveOrder(orderId: Int) {
        viewModelScope.launch {
            val result = repository.archiveKitchenOrder(orderId)
            if (result is Result.Success) {
                // Remover de la lista local de historial para refrescar UI
                val currentHistory = _historyOrders.value
                if (currentHistory is Result.Success) {
                    val updatedList = currentHistory.data.filter { it.id != orderId }
                    _historyOrders.postValue(Result.Success(updatedList))
                }
            }
        }
    }

    fun archiveAllHistory() {
        viewModelScope.launch {
            val result = repository.archiveAllKitchenHistory()
            if (result is Result.Success) {
                _historyOrders.postValue(Result.Success(emptyList()))
            }
        }
    }

    fun loadDishes() {
        viewModelScope.launch {
            _dishes.value = repository.getDishesWithRecipe()
        }
    }

    fun loadRecipe(dishId: Int, name: String? = null, images: List<String>? = null) {
        clickedDishName = name
        clickedDishImages = images
        viewModelScope.launch {
            _currentRecipe.value = repository.getDishRecipe(dishId)
        }
    }

    fun resetRecipeState() {
        _currentRecipe.value = Result.Idle
    }

    fun updateOrderStatus(orderId: Int, status: String) {
        viewModelScope.launch {
            val result = repository.updateKitchenOrderStatus(orderId, status)
            if (result is Result.Success) {
                refreshData()
            }
        }
    }

    fun updateItemStatus(itemId: Int, status: String) {
        viewModelScope.launch {
            val result = repository.updateKitchenItemStatus(itemId, status)
            if (result is Result.Success) {
                refreshData()
            }
        }
    }

    fun startSession() {
        viewModelScope.launch {
            val result = repository.startKitchenSession()
            if (result is Result.Success) {
                refreshData()
            }
        }
    }

    fun endSession(sessionId: Int) {
        viewModelScope.launch {
            val result = repository.endKitchenSession(sessionId)
            if (result is Result.Success) {
                refreshData()
            }
        }
    }

    fun logout(onComplete: () -> Unit) {
        stopPolling()
        viewModelScope.launch {
            authRepository.logout()
            onComplete()
        }
    }

    override fun onCleared() {
        super.onCleared()
        stopPolling()
    }
}
