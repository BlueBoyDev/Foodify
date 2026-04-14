// RUTA: app/src/main/java/com/codex/foodify/data/repository/FoodifyRepository.kt
package com.codex.foodify.data.repository

import com.codex.foodify.data.api.FoodifyApi
import com.codex.foodify.data.api.TokenManager
import com.codex.foodify.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FoodifyRepository @Inject constructor(
    private val api: FoodifyApi,
    private val tokenManager: TokenManager
) {

    suspend fun uploadImage(file: MultipartBody.Part): Result<String> =
        safeApiCall { api.uploadFile(file) }.map { it.data?.url ?: "" }

    // ── Platillos ────────────────────────────────────────────────
    suspend fun getDishes(search: String? = null, categoryId: Int? = null): Result<List<Dish>> =
        safeApiCall { api.getDishes(categoryId = categoryId, search = search) }.map { it.data ?: emptyList() }

    suspend fun getDish(id: Int): Result<Dish> =
        safeApiCall { api.getDish(id) }.map { it.data!! }

    suspend fun createDish(req: CreateDishRequest): Result<Dish> =
        safeApiCall { api.createDish(req) }.map { it.data!! }

    suspend fun updateDish(id: Int, req: CreateDishRequest): Result<Dish> =
        safeApiCall { api.updateDish(id, req) }.map { it.data!! }

    suspend fun toggleDishAvailability(id: Int): Result<Dish> =
        safeApiCall { api.toggleDishAvailability(id) }.map { it.data!! }

    suspend fun deleteDish(id: Int): Result<Unit> =
        safeApiCallJorge { api.deleteDish(id) }.map { Unit }

    // ── Menús ─────────────────────────────────────────────────────
    suspend fun getMenus(): Result<List<Menu>> =
        safeApiCall { api.getMenus() }.map { it.data ?: emptyList() }

    suspend fun createMenu(req: CreateMenuRequest): Result<Menu> =
        safeApiCall { api.createMenu(req) }.map { it.data!! }

    suspend fun updateMenu(id: Int, req: CreateMenuRequest): Result<Menu> =
        safeApiCall { api.updateMenu(id, req) }.map { it.data!! }

    suspend fun updateMenuStatus(id: Int, isActive: Boolean): Result<Menu> =
        safeApiCall { api.updateMenuStatus(id, mapOf("isActive" to isActive)) }.map { it.data!! }

    suspend fun deleteMenu(id: Int): Result<Unit> =
        safeApiCallJorge { api.deleteMenu(id) }.map { Unit }

    suspend fun getMenuCategories(menuId: Int): Result<List<Category>> =
        safeApiCall { api.getCategories(menuId) }.map { resp ->
            resp.data ?: emptyList()
        }

    suspend fun updateCategorySortOrder(menuId: Int, categoryId: Int, sortOrder: Int): Result<Category> =
        safeApiCall { 
            api.updateCategorySortOrder(menuId, categoryId, UpdateSortOrderRequest(sortOrder)) 
        }.map { it.data!! }

    suspend fun createCategory(menuId: Int, name: String): Result<DishCategory> =
        safeApiCall {
            api.createCategoryModern(
                menuId,
                CreateCategoryRequest(name, null, 0, null, null, true)
            )
        }.map {
            val c = it.data!!
            DishCategory(c.id, c.name, c.menuId)
        }

    // ── Staff ────────────────────────────────────────────────────
    suspend fun getStaff(rol: String? = null, activo: Boolean? = null): Result<List<Staff>> =
        safeApiCall { api.getStaff(rol, activo) }.map { it.data ?: emptyList() }

    suspend fun createStaff(req: CreateStaffRequest): Result<Staff> =
        safeApiCall { api.createStaff(req) }.map { it.data!! }

    suspend fun updateStaff(id: Int, req: Map<String, Any>): Result<Staff> =
        safeApiCall { api.updateStaff(id, req) }.map { it.data!! }

    suspend fun deleteStaff(id: Int): Result<Unit> =
        safeApiCallJorge { api.deleteStaff(id) }.map { Unit }

    // ── Inventario ───────────────────────────────────────────────
    suspend fun getInventoryItems(): Result<List<InventoryItem>> =
        safeApiCall { api.getInventoryItems() }.map { it.data ?: emptyList() }

    suspend fun getInventoryLots(itemId: Int? = null, expiringSoon: Boolean? = null): Result<List<InventoryLot>> =
        safeApiCall { api.getInventoryLots(itemId, expiringSoon) }.map { it.data ?: emptyList() }

    suspend fun createLot(req: CreateLotRequest): Result<InventoryLot> =
        safeApiCall { api.createLot(req) }.map { it.data!! }

    suspend fun createLotLegacy(req: Map<String, Any?>): Result<InventoryLot> =
        safeApiCall { api.createLotLegacy(req) }.map { it.data!! }

    suspend fun updateLot(id: Int, req: Map<String, Any?>): Result<InventoryLot> =
        safeApiCall { api.updateLot(id, req) }.map { it.data!! }

    suspend fun deleteLot(id: Int): Result<Unit> =
        safeApiCallJorge { api.deleteLot(id) }.map { Unit }

    suspend fun getInventoryAlerts(): Result<List<InventoryAlert>> =
        safeApiCall { api.getInventoryAlerts() }.map { it.data ?: emptyList() }

    suspend fun resolveAlert(id: Int): Result<Unit> =
        safeApiCallJorge { api.resolveAlert(id) }.map { Unit }

    suspend fun createAdjustment(lotId: Int, quantity: Double, notes: String? = null): Result<Unit> =
        safeApiCall {
            api.createAdjustment(buildMap {
                put("lotId", lotId)
                put("quantity", quantity)
                if (notes != null) put("notes", notes)
            })
        }.map { Unit }

    // ── Mesas ────────────────────────────────────────────────────
    suspend fun getTables(): Result<List<Table>> =
        safeApiCall { api.getTables() }.map { it.data ?: emptyList() }

    suspend fun updateTableStatus(id: Int, status: String): Result<Table> =
        safeApiCall { api.updateTableStatus(id, UpdateTableStatusRequest(status)) }.map { it.data!! }

    suspend fun createTable(number: Int, capacity: Int = 4): Result<Table> =
        safeApiCall { api.createTable(mapOf("number" to number, "capacity" to capacity)) }.map { it.data!! }

    suspend fun deleteTable(id: Int): Result<Unit> =
        safeApiCallJorge { api.deleteTable(id) }.map { Unit }

    // ── Pedidos ──────────────────────────────────────────────────
    suspend fun getOrders(status: String? = null, kitchenStatus: String? = null): Result<List<Order>> =
        safeApiCall { api.getOrders(status, kitchenStatus) }.map { it.data ?: emptyList() }

    suspend fun getActiveOrders(): Result<List<Order>> =
        safeApiCall { api.getActiveOrders() }.map { it.data ?: emptyList() }

    suspend fun getOrder(id: Int): Result<Order> =
        safeApiCall { api.getOrder(id) }.map { it.data!! }

    suspend fun createOrder(req: CreateOrderRequest): Result<Order> =
        safeApiCall { api.createOrder(req) }.map { it.data!! }

    suspend fun updateOrderStatus(id: Int, status: String, cancelReason: String? = null): Result<Order> =
        safeApiCall { api.updateOrderStatus(id, UpdateOrderStatusRequest(status, cancelReason)) }.map { it.data!! }

    suspend fun scanQr(id: Int): Result<Order> =
        safeApiCall { api.scanQr(id) }.map { it.data!! }

    // ── Cocina (MODERN DTO) ───────────────────────────────────────
    suspend fun getKitchenOrders(status: String? = null): Result<List<KitchenOrderDto>> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) Result.Error("No token")
        else Result.Success(api.getKitchenOrdersDto("Bearer $token", status).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun updateKitchenOrderStatus(orderId: Int, status: String): Result<KitchenOrderDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.updateKitchenOrderStatusDto("Bearer $token", orderId, mapOf("status" to status)).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun updateKitchenItemStatus(itemId: Int, status: String): Result<KitchenOrderItemDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.updateKitchenItemStatusDto("Bearer $token", itemId, mapOf("status" to status)).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getKitchenStats(): Result<KitchenStatsDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.getKitchenStats("Bearer $token").data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getDishesWithRecipe(): Result<List<DishWithRecipeDto>> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.getDishesWithRecipe("Bearer $token").data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getDishRecipe(dishId: Int): Result<RecipeDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        val response = api.getDishRecipe("Bearer $token", dishId)
        Result.Success(response.data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun upsertDishRecipe(dishId: Int, recipe: RecipeDto): Result<RecipeDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.upsertDishRecipe("Bearer $token", dishId, recipe).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun startKitchenSession(): Result<KitchenSessionDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.startKitchenSessionDto("Bearer $token").data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun endKitchenSession(sessionId: Int): Result<KitchenSessionDto> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.endKitchenSessionDto("Bearer $token", sessionId).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getKitchenHistory(date: String? = null): Result<List<KitchenOrderDto>> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        Result.Success(api.getKitchenHistory("Bearer $token", date).data)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun archiveKitchenOrder(orderId: Int): Result<Unit> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        api.archiveKitchenOrder("Bearer $token", orderId)
        Result.Success(Unit)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun archiveAllKitchenHistory(): Result<Unit> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        api.archiveAllKitchenHistory("Bearer $token")
        Result.Success(Unit)
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    // ── Pedidos DTO (Waiter/Cashier) ───────────────────────────────
    suspend fun getActiveOrdersDto(): Result<List<OrderDto>> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.getActiveOrdersDto("Bearer $token").data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun getAllOrdersDto(status: String? = null): Result<List<OrderDto>> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.getAllOrdersDto("Bearer $token", status).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun scanOrderQr(orderId: Int): Result<ScanQrResponse> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.scanOrderQrDto("Bearer $token", orderId).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun getOrderByIdDto(orderId: Int): Result<OrderDto> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.getOrderByIdDto("Bearer $token", orderId).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun updateOrderStatusDto(orderId: Int, body: Map<String, String>): Result<OrderDto> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.updateOrderStatusDto("Bearer $token", orderId, body).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun updateOrderDto(orderId: Int, req: CreateOrderRequest): Result<OrderDto> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.updateOrderDto("Bearer $token", orderId, req).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun claimOrderDto(orderId: Int): Result<OrderDto> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.claimOrderDto("Bearer $token", orderId).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun getTablesDto(): Result<List<TableDto>> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.getTablesDto("Bearer $token").data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun getStaffReports(period: String = "month"): Result<List<StaffMetricDto>> = try {
        val token = tokenManager.getAccessToken()
        if (token == null) {
            Result.Error("No hay token de autenticación")
        } else {
            Result.Success(api.getStaffReports("Bearer $token", period).data)
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de red")
    }

    suspend fun getDashboard(restaurantId: Int): Result<Map<String, Any>> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        safeApiCall { api.getDashboard("Bearer $token", restaurantId) }.map { it.data ?: emptyMap() }
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getWeeklySales(): Result<List<DailySales>> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        safeApiCall { api.getSalesReport("Bearer $token", "week") }.map { it.data ?: emptyList() }
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    suspend fun getTopDishes(limit: Int = 3): Result<List<TopDish>> = try {
        val token = tokenManager.getAccessToken() ?: throw Exception("No token")
        safeApiCall { api.getTopDishes("Bearer $token", limit) }.map { it.data ?: emptyList() }
    } catch (e: Exception) { Result.Error(e.message ?: "Error") }

    // ── Utils ────────────────────────────────────────────────────

    private suspend fun <T> safeApiCall(call: suspend () -> Response<ApiResponse<T>>): Result<ApiResponse<T>> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                Result.Success(response.body()!!)
            } else {
                val errorMsg = when (response.code()) {
                    401 -> "Sesión expirada o no autorizado."
                    403 -> "No tienes permiso para esta acción."
                    404 -> "Recurso no encontrado."
                    else -> "Error del servidor (${response.code()})"
                }
                Result.Error(errorMsg, response.code())
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de red")
        }
    }

    private suspend fun <T> safeApiCallJorge(call: suspend () -> Response<T>): Result<T> {
        return try {
            val response = call()
            if (response.isSuccessful) {
                @Suppress("UNCHECKED_CAST")
                Result.Success(response.body() ?: Unit as T)
            } else {
                val errorMsg = when (response.code()) {
                    401 -> "Sesión expirada o no autorizado."
                    403 -> "No tienes permiso para esta acción."
                    else -> "Error (${response.code()})"
                }
                Result.Error(errorMsg, response.code())
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de red")
        }
    }

    private fun <T, R> Result<T>.map(transform: (T) -> R): Result<R> {
        return when (this) {
            is Result.Success -> Result.Success(transform(data))
            is Result.Error -> Result.Error(message, code)
            is Result.Loading -> Result.Loading
            is Result.Idle -> Result.Idle
        }
    }
}
