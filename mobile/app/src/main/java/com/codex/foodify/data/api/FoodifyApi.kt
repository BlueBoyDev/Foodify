// RUTA: app/src/main/java/com/codex/foodify/data/api/FoodifyApi.kt
package com.codex.foodify.data.api

import com.codex.foodify.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface FoodifyApi {

    @Multipart
    @POST("upload")
    suspend fun uploadFile(
        @Part file: MultipartBody.Part
    ): Response<ApiResponse<UploadResponse>>

    // ── AUTH ──────────────────────────────────────────────────────
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>

    @POST("auth/refresh")
    suspend fun refresh(@Body body: Map<String, String>): Response<ApiResponse<LoginResponse>>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<UserProfile>>

    @PATCH("auth/fcm-token")
    suspend fun updateFcmToken(@Body body: Map<String, String>): Response<Unit>

    // ── DASHBOARD ─────────────────────────────────────────────────
    @GET("restaurants/{id}/dashboard")
    suspend fun getDashboard(
        @Header("Authorization") token: String,
        @Path("id") restaurantId: Int
    ): Response<ApiResponse<Map<String, Any>>>

    @GET("reports/sales")
    suspend fun getSalesReport(
        @Header("Authorization") token: String,
        @Query("period") period: String = "week"
    ): Response<ApiResponse<List<DailySales>>>

    @GET("reports/staff")
    suspend fun getStaffReports(
        @Header("Authorization") token: String,
        @Query("period") period: String = "month"
    ): ApiListResponse<StaffMetricDto>

    @GET("reports/dishes/top")
    suspend fun getTopDishes(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 5
    ): Response<ApiResponse<List<TopDish>>>

    // ── PLATILLOS / DISHES ────────────────────────────────────────
    @GET("dishes")
    suspend fun getDishes(
        @Query("categoryId") categoryId: Int? = null,
        @Query("available") available: Boolean? = null,
        @Query("search") search: String? = null,
    ): Response<ApiResponse<List<Dish>>>

    @GET("dishes/{id}")
    suspend fun getDish(@Path("id") id: Int): Response<ApiResponse<Dish>>

    @POST("dishes")
    suspend fun createDish(@Body request: CreateDishRequest): Response<ApiResponse<Dish>>

    @PUT("dishes/{id}")
    suspend fun updateDish(@Path("id") id: Int, @Body request: CreateDishRequest): Response<ApiResponse<Dish>>

    @PATCH("dishes/{id}/availability")
    suspend fun toggleDishAvailability(@Path("id") id: Int): Response<ApiResponse<Dish>>

    @DELETE("dishes/{id}")
    suspend fun deleteDish(@Path("id") id: Int): Response<Unit>

    // ── MENÚS ─────────────────────────────────────────────────────
    @GET("menus")
    suspend fun getMenus(): Response<ApiResponse<List<Menu>>>

    @POST("menus")
    suspend fun createMenu(@Body request: CreateMenuRequest): Response<ApiResponse<Menu>>

    @PUT("menus/{id}")
    suspend fun updateMenu(@Path("id") id: Int, @Body request: CreateMenuRequest): Response<ApiResponse<Menu>>

    @PATCH("menus/{id}/status")
    suspend fun updateMenuStatus(@Path("id") id: Int, @Body body: Map<String, Any>): Response<ApiResponse<Menu>>

    @DELETE("menus/{id}")
    suspend fun deleteMenu(@Path("id") id: Int): Response<Unit>

    // ── CATEGORÍAS (MODERN V1) ───────────────────────────────────
    @GET("menus/{menuId}/categories")
    suspend fun getCategories(
        @Path("menuId") menuId: Int
    ): Response<ApiResponse<List<Category>>>

    @POST("menus/{menuId}/categories")
    suspend fun createCategoryModern(
        @Path("menuId") menuId: Int,
        @Body body: CreateCategoryRequest
    ): Response<ApiResponse<Category>>

    @PUT("menus/{menuId}/categories/{id}")
    suspend fun updateCategory(
        @Path("menuId") menuId: Int,
        @Path("id") categoryId: Int,
        @Body body: UpdateCategoryRequest
    ): Response<ApiResponse<Category>>

    @PATCH("menus/{menuId}/categories/{id}/sort")
    suspend fun updateCategorySortOrder(
        @Path("menuId") menuId: Int,
        @Path("id") categoryId: Int,
        @Body body: UpdateSortOrderRequest
    ): Response<ApiResponse<Category>>

    @DELETE("menus/{menuId}/categories/{id}")
    suspend fun deleteCategory(
        @Path("menuId") menuId: Int,
        @Path("id") categoryId: Int
    ): Response<Unit>

    // ── STAFF / USUARIOS ──────────────────────────────────────────
    @GET("users")
    suspend fun getUsers(): Response<ApiResponse<List<Staff>>>

    @POST("users")
    suspend fun createUser(@Body request: CreateStaffRequest): Response<ApiResponse<Staff>>

    @PATCH("users/{id}")
    suspend fun updateUser(@Path("id") id: Int, @Body request: Map<String, @JvmSuppressWildcards Any>): Response<ApiResponse<Staff>>

    @DELETE("users/{id}")
    suspend fun deleteUser(@Path("id") id: Int): Response<Unit>

    // Alias staff (Usando ruta base 'users' para compatibilidad con backend v3.2)
    @GET("users")
    suspend fun getStaff(
        @Query("role") role: String? = null,
        @Query("isActive") isActive: Boolean? = null,
    ): Response<ApiResponse<List<Staff>>>

    @POST("users")
    suspend fun createStaff(@Body request: CreateStaffRequest): Response<ApiResponse<Staff>>

    @PATCH("users/{id}")
    suspend fun updateStaff(@Path("id") id: Int, @Body request: Map<String, @JvmSuppressWildcards Any>): Response<ApiResponse<Staff>>

    @DELETE("users/{id}")
    suspend fun deleteStaff(@Path("id") id: Int): Response<Unit>

    // ── INVENTARIO ────────────────────────────────────────────────
    @GET("inventory/items")
    suspend fun getInventoryItems(): Response<ApiResponse<List<InventoryItem>>>

    @GET("inventory/lots")
    suspend fun getInventoryLots(
        @Query("itemId") itemId: Int? = null,
        @Query("expiringSoon") expiringSoon: Boolean? = null,
    ): Response<ApiResponse<List<InventoryLot>>>

    @POST("inventory/lots")
    suspend fun createLot(@Body request: CreateLotRequest): Response<ApiResponse<InventoryLot>>

    // Nueva ruta para crear lote con nombre de item directamente (Legacy/V3.2 compatibility)
    @POST("inventory/lots")
    suspend fun createLotLegacy(@Body request: Map<String, @JvmSuppressWildcards Any?>): Response<ApiResponse<InventoryLot>>

    @PUT("inventory/lots/{id}")
    suspend fun updateLot(@Path("id") id: Int, @Body request: Map<String, @JvmSuppressWildcards Any?>): Response<ApiResponse<InventoryLot>>

    @DELETE("inventory/lots/{id}")
    suspend fun deleteLot(@Path("id") id: Int): Response<Unit>

    @GET("inventory/alerts")
    suspend fun getInventoryAlerts(): Response<ApiResponse<List<InventoryAlert>>>

    @PATCH("inventory/alerts/{id}/resolve")
    suspend fun resolveAlert(@Path("id") id: Int): Response<Unit>

    @POST("inventory/adjustments")
    suspend fun createAdjustment(@Body request: Map<String, Any>): Response<ApiResponse<Any>>

    // ── MESAS ─────────────────────────────────────────────────────
    @GET("tables")
    suspend fun getTables(): Response<ApiResponse<List<Table>>>

    @POST("tables")
    suspend fun createTable(@Body request: Map<String, @JvmSuppressWildcards Any>): Response<ApiResponse<Table>>

    @PATCH("tables/{id}/status")
    suspend fun updateTableStatus(
        @Path("id") id: Int,
        @Body request: UpdateTableStatusRequest,
    ): Response<ApiResponse<Table>>

    @DELETE("tables/{id}")
    suspend fun deleteTable(@Path("id") id: Int): Response<Unit>

    // ── PEDIDOS ───────────────────────────────────────────────────
    @GET("orders")
    suspend fun getOrders(
        @Query("status") status: String? = null,
        @Query("kitchenStatus") kitchenStatus: String? = null,
        @Query("tableId") tableId: Int? = null,
    ): Response<ApiResponse<List<Order>>>

    @GET("orders/active")
    suspend fun getActiveOrders(): Response<ApiResponse<List<Order>>>

    @GET("orders/{id}")
    suspend fun getOrder(@Path("id") id: Int): Response<ApiResponse<Order>>

    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): Response<ApiResponse<Order>>

    @PATCH("orders/{id}/status")
    suspend fun updateOrderStatus(
        @Path("id") id: Int,
        @Body request: UpdateOrderStatusRequest,
    ): Response<ApiResponse<Order>>

    @PATCH("orders/{id}/scan-qr")
    suspend fun scanQr(@Path("id") id: Int): Response<ApiResponse<Order>>

    // ── PEDIDOS DTO (Waiter/Cashier) ───────────────────────────────
    @GET("orders/active")
    suspend fun getActiveOrdersDto(
        @Header("Authorization") token: String
    ): ApiListResponse<OrderDto>

    @GET("orders")
    suspend fun getAllOrdersDto(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null
    ): ApiListResponse<OrderDto>

    @GET("orders/{id}")
    suspend fun getOrderByIdDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int
    ): ApiSingleResponse<OrderDto>

    @PATCH("orders/{id}/scan-qr")
    suspend fun scanOrderQrDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int
    ): ApiSingleResponse<ScanQrResponse>

    @PATCH("orders/{id}/status")
    suspend fun updateOrderStatusDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int,
        @Body body: Map<String, String>
    ): ApiSingleResponse<OrderDto>
    
    @PATCH("orders/{id}")
    suspend fun updateOrderDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int,
        @Body request: CreateOrderRequest
    ): ApiSingleResponse<OrderDto>

    @PATCH("orders/{id}/claim")
    suspend fun claimOrderDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int
    ): ApiSingleResponse<OrderDto>

    // ── MESAS DTO ──────────────────────────────────────────────────
    @GET("tables")
    suspend fun getTablesDto(
        @Header("Authorization") token: String
    ): ApiListResponse<TableDto>

    // ── COCINA (MODERN DTO) ───────────────────────────────────────
    @GET("kitchen/orders")
    suspend fun getKitchenOrdersDto(
        @Header("Authorization") token: String,
        @Query("status") status: String? = null
    ): ApiListResponse<KitchenOrderDto>

    @PATCH("kitchen/orders/{id}/status")
    suspend fun updateKitchenOrderStatusDto(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int,
        @Body body: Map<String, String>
    ): ApiSingleResponse<KitchenOrderDto>

    @PATCH("kitchen/order-items/{id}/status")
    suspend fun updateKitchenItemStatusDto(
        @Header("Authorization") token: String,
        @Path("id") itemId: Int,
        @Body body: Map<String, String>
    ): ApiSingleResponse<KitchenOrderItemDto>

    @GET("kitchen/stats")
    suspend fun getKitchenStats(
        @Header("Authorization") token: String
    ): ApiSingleResponse<KitchenStatsDto>

    @GET("dishes/{id}/recipe")
    suspend fun getDishRecipe(
        @Header("Authorization") token: String,
        @Path("id") dishId: Int
    ): ApiSingleResponse<RecipeDto>

    @PUT("dishes/{id}/recipe")
    suspend fun upsertDishRecipe(
        @Header("Authorization") token: String,
        @Path("id") dishId: Int,
        @Body recipe: RecipeDto
    ): ApiSingleResponse<RecipeDto>

    @GET("dishes")
    suspend fun getDishesWithRecipe(
        @Header("Authorization") token: String,
        @Query("withRecipe") withRecipe: Boolean = true
    ): ApiListResponse<DishWithRecipeDto>

    @POST("kitchen/sessions/start")
    suspend fun startKitchenSessionDto(
        @Header("Authorization") token: String
    ): ApiSingleResponse<KitchenSessionDto>

    @PATCH("kitchen/sessions/{id}/end")
    suspend fun endKitchenSessionDto(
        @Header("Authorization") token: String,
        @Path("id") sessionId: Int
    ): ApiSingleResponse<KitchenSessionDto>

    @GET("kitchen/orders/history")
    suspend fun getKitchenHistory(
        @Header("Authorization") token: String,
        @Query("date") date: String? = null
    ): ApiListResponse<KitchenOrderDto>

    @PATCH("kitchen/orders/{id}/archive")
    suspend fun archiveKitchenOrder(
        @Header("Authorization") token: String,
        @Path("id") orderId: Int
    ): ApiSingleResponse<Map<String, Any>>

    @PATCH("kitchen/orders/archive-all")
    suspend fun archiveAllKitchenHistory(
        @Header("Authorization") token: String
    ): ApiSingleResponse<Map<String, Any>>
}
