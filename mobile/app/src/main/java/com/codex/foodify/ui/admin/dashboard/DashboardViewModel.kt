// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dashboard/DashboardViewModel.kt
package com.codex.foodify.ui.admin.dashboard

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.DailySales
import com.codex.foodify.data.model.StaffMetricDto
import com.codex.foodify.data.model.TopDish
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val repository: FoodifyRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _dashboardState = MutableLiveData<Result<Map<String, Any>>>()
    val dashboardState: LiveData<Result<Map<String, Any>>> = _dashboardState

    private val _weeklySales = MutableLiveData<List<DailySales>>()
    val weeklySales: LiveData<List<DailySales>> = _weeklySales

    private val _topDishes = MutableLiveData<List<TopDish>>()
    val topDishes: LiveData<List<TopDish>> = _topDishes

    private val _alerts = MutableLiveData<List<com.codex.foodify.data.model.InventoryAlert>>()
    val alerts: LiveData<List<com.codex.foodify.data.model.InventoryAlert>> = _alerts

    private val _staffMetrics = MutableLiveData<List<StaffMetricDto>>()
    val staffMetrics: LiveData<List<StaffMetricDto>> = _staffMetrics

    fun loadDashboard() {
        _dashboardState.value = Result.Loading
        viewModelScope.launch {
            // Obtener el ID dinámico del restaurante del usuario logueado
            val restaurantId = authRepository.restaurantId.firstOrNull() ?: 1
            android.util.Log.d("DashboardVM", "Cargando dashboard para restaurante ID: $restaurantId")
            
            // 1. KPIs Generales
            val result = repository.getDashboard(restaurantId)
            _dashboardState.value = result

            // 2. Ventas Semanales (Reas)
            val salesResult = repository.getWeeklySales()
            _weeklySales.value = if (salesResult is Result.Success) salesResult.data else emptyList()

            // 3. Top Platillos (Real)
            val topDishesResult = repository.getTopDishes(3)
            _topDishes.value = if (topDishesResult is Result.Success) topDishesResult.data else emptyList()

            // 4. Cargar alertas reales
            val alertsResult = repository.getInventoryAlerts()
            _alerts.value = if (alertsResult is Result.Success) alertsResult.data else emptyList()

            // 5. Cargar métricas de staff
            val staffResult = repository.getStaffReports("month")
            if (staffResult is Result.Success) {
                _staffMetrics.value = staffResult.data
            }
        }
    }
}
