package com.codex.foodify.data.model
 
import android.os.Parcelable
import com.google.gson.annotations.SerializedName
import kotlinx.parcelize.Parcelize
import kotlinx.parcelize.RawValue
 
// --- Auth ---------------------------------------------------------
data class LoginRequest(val email: String, val password: String)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val role: String,
    val planName: String,
    val subscriptionStatus: String,
    val restaurantId: Int? = null,
)

data class UserProfile(
    val id: Int,
    val email: String,
    val role: String,
    val restaurantId: Int?,
    val planName: String,
    val subscriptionStatus: String,
    val fullName: String? = null,
)

// --- Roles --------------------------------------------------------
enum class UserRole(val displayName: String, val displayNameJorge: String) {
    SAAS_ADMIN("saas_admin", "Admin CODEX"),
    RESTAURANT_ADMIN("restaurant_admin", "Admin"),
    WAITER("waiter", "Mesero"),
    CHEF("chef", "Cocina"),
    CASHIER("cashier", "Cajero");

    companion object {
        fun from(value: String?): UserRole =
            values().firstOrNull { it.displayName == value } ?: RESTAURANT_ADMIN
    }
}

// --- Dashboard ----------------------------------------------------
data class DashboardKpi(
    val salesMonth: Double,
    val ordersToday: Int,
    val inventoryValue: Double,
    val activeAlerts: Int,
    val weeklySales: List<DailySales> = emptyList(),
    val topDishes: List<TopDish> = emptyList(),
)

data class DailySales(val day: String, val amount: Double)
data class TopDish(val name: String, val quantity: Int, val color: String? = null)

// --- Platillos (Dishes) -------------------------------------------
data class Dish(
    val id: Int,
    val name: String,
    val price: Double,
    @SerializedName("prepTimeMin", alternate = ["prep_time_min"]) val prepTimeMin: Int = 15,
    val description: String? = null,
    @SerializedName("isAvailable", alternate = ["is_available"]) val isAvailable: Boolean = true,
    val images: List<String>? = null,
    @SerializedName("categoryId", alternate = ["category_id"]) val categoryId: Int? = null,
    val category: DishCategory? = null,
    @SerializedName("marginPct", alternate = ["margin_pct"]) val marginPct: Double? = null,
    val allergens: List<String>? = null,
    // Alias Jorge
    val nombre: String? = null,
    val precio: Double? = null,
    val tiempo: Int? = null,
    @SerializedName("imagenUri") val imagenUri: String? = null,
    val disponible: Boolean? = null,
) {
    val displayName: String get() = nombre ?: name
    val displayPrice: Double get() = precio ?: price
    val displayTime: Int get() = tiempo ?: prepTimeMin
    val displayImage: String? get() = imagenUri ?: images?.firstOrNull()
    val displayAvailable: Boolean get() = disponible ?: isAvailable
}

@Parcelize
data class DishCategory(
    val id: Int,
    val name: String,
    @SerializedName("menuId", alternate = ["menu_id"]) val menuId: Int? = null,
) : Parcelable


data class CreateDishRequest(
    val name: String,
    val price: Double,
    @SerializedName("prepTimeMin") val prepTimeMin: Int,
    val description: String? = null,
    @SerializedName("categoryId") val categoryId: Int? = null,
    val allergens: List<String>? = null,
    val images: List<String>? = null,
)

data class UploadResponse(val url: String)

// --- Staff / Usuarios --------------------------------------------
data class Staff(
    val id: Int,
    @SerializedName("fullName", alternate = ["full_name"]) val fullName: String? = null,
    val email: String,
    val phone: String? = null,
    val role: String? = null,
    @SerializedName("isActive", alternate = ["is_active"]) val isActive: Boolean = true,
    @SerializedName("createdAt", alternate = ["created_at"]) val createdAt: String? = null,
    val nombre: String? = null,
    val apellido: String? = null,
    val telefono: String? = null,
    val rol: String? = null,
    val activo: Boolean? = null,
    @SerializedName("fechaCreacion") val fechaCreacion: String? = null,
) {
    val displayName: String get() = fullName ?: "${nombre ?: ""} ${apellido ?: ""}".trim()
    val displayRole: String get() = UserRole.from(role ?: rol).displayNameJorge
    val displayActive: Boolean get() = activo ?: isActive
    val displayPhone: String get() = telefono ?: phone ?: ""
    val displayDate: String get() = fechaCreacion ?: createdAt?.take(10) ?: ""
}

data class CreateStaffRequest(
    @SerializedName("fullName") val fullName: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("role") val role: String,
    @SerializedName("phone") val phone: String? = null,
)

// --- Inventario --------------------------------------------------
data class InventoryItem(
    val id: Int,
    val name: String,
    val unit: String,
    @SerializedName("minStock", alternate = ["min_stock"]) val minStock: Double = 0.0,
    @SerializedName("currentStock", alternate = ["current_stock"]) val currentStock: Double = 0.0,
    val category: String? = null,
    val alerts: List<InventoryAlert>? = null,
)

data class InventoryLot(
    val id: Int,
    @SerializedName("itemId", alternate = ["item_id"]) val itemId: Int,
    val item: InventoryItem? = null,
    @SerializedName("lotNumber", alternate = ["lot_number"]) val lotNumber: String? = null,
    val quantity: Double,
    val remaining: Double,
    @SerializedName("unitCost", alternate = ["unit_cost"]) val unitCost: Double,
    val supplier: String? = null,
    @SerializedName("entryDate", alternate = ["entry_date"]) val entryDate: String,
    @SerializedName("expiryDate", alternate = ["expiry_date"]) val expiryDate: String? = null,
    val status: String = "available",
    val alertFlag: Boolean? = null,
) {
    val displayStatus: String get() = when (calculatedStatus) {
        "available" -> "Disponible"
        "low"       -> "Próximo a caducar"
        "critical"  -> "Stock crítico"
        "expired"   -> "Caducado"
        "depleted"  -> "Sin stock"
        else        -> calculatedStatus
    }

    // Cálculo de estado en tiempo real para feedback inmediato
    val calculatedStatus: String get() {
        if (remaining <= 0) return "depleted"
        
        val expiry = expiryDate ?: return "available"
        return try {
            val sdf = java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault())
            val expiryDateObj = sdf.parse(expiry)
            val today = java.util.Calendar.getInstance()
            today.set(java.util.Calendar.HOUR_OF_DAY, 0)
            today.set(java.util.Calendar.MINUTE, 0)
            today.set(java.util.Calendar.SECOND, 0)
            today.set(java.util.Calendar.MILLISECOND, 0)
            
            if (expiryDateObj != null) {
                if (expiryDateObj.before(today.time)) return "expired"
                
                val diff = expiryDateObj.time - today.timeInMillis
                val days = diff / (24 * 60 * 60 * 1000)
                if (days <= 7) return "low"
            }
            "available"
        } catch (e: Exception) {
            status
        }
    }
}

data class IngredientGroup(
    val itemName: String,
    val unit: String,
    val category: String?,
    val totalRemaining: Double,
    val lots: List<InventoryLot>,
    val status: String // El "peor" estado de sus lotes para el filtro
)

data class InventoryAlert(
    val id: Int,
    @SerializedName("itemId", alternate = ["item_id"]) val itemId: Int,
    @SerializedName("itemName", alternate = ["item_name"]) val itemName: String? = null,
    val type: String,
    val message: String,
    @SerializedName("isResolved", alternate = ["is_resolved"]) val isResolved: Boolean = false,
)

data class CreateLotRequest(
    @SerializedName("itemId", alternate = ["item_id"]) val itemId: Int,
    val quantity: Double,
    @SerializedName("unitCost", alternate = ["unit_cost"]) val unitCost: Double,
    val supplier: String? = null,
    @SerializedName("entryDate", alternate = ["entry_date"]) val entryDate: String,
    @SerializedName("expiryDate", alternate = ["expiry_date"]) val expiryDate: String? = null,
    @SerializedName("lotNumber", alternate = ["lot_number"]) val lotNumber: String? = null,
)

// --- Mesas --------------------------------------------------------
data class Table(
    val id: Int,
    val number: Int,
    val capacity: Int = 4,
    @SerializedName("qrCodeUrl", alternate = ["qr_code_url"]) val qrCodeUrl: String? = null,
    val status: String = "available",
) {
    val displayStatus: String get() = when (status) {
        "available" -> "Libre"
        "occupied"  -> "Ocupada"
        "reserved"  -> "Reservada"
        "cleaning"  -> "Limpieza"
        else        -> status
    }
}

data class UpdateTableStatusRequest(val status: String)

// --- Pedidos ------------------------------------------------------
data class Order(
    val id: Int,
    @SerializedName("orderNumber", alternate = ["order_number"]) val orderNumber: String,
    val status: String = "pending",
    @SerializedName("kitchenStatus", alternate = ["kitchen_status"]) val kitchenStatus: String = "pending",
    val type: String = "dine_in",
    @SerializedName("customerName", alternate = ["customer_name"]) val customerName: String? = null,
    val total: Double = 0.0,
    @SerializedName("createdAt", alternate = ["created_at"]) val createdAt: String,
    val items: List<OrderItem>? = null,
    val table: Table? = null,
) {
    val displayStatus: String get() = when (status) {
        "pending"   -> "Pendiente"
        "preparing" -> "Preparando"
        "ready"     -> "Listo"
        "delivered" -> "Entregado"
        "cancelled" -> "Cancelado"
        else        -> status
    }

    val displayKitchenStatus: String get() = when (kitchenStatus) {
        "pending"   -> "Pendiente"
        "preparing" -> "En Cocina"
        "ready"     -> "Preparado"
        "delivered" -> "Servido"
        else        -> kitchenStatus
    }
}

data class OrderItem(
    val id: Int,
    @SerializedName("dishId", alternate = ["dish_id"]) val dishId: Int,
    val quantity: Int,
    val subtotal: Double,
    val status: String = "pending",
    val dish: Dish? = null,
    @SerializedName("specialNotes", alternate = ["special_notes"]) val specialNotes: String? = null,
)

data class CreateOrderRequest(
    val type: String = "dine_in",
    @SerializedName("tableId", alternate = ["table_id"]) val tableId: Int? = null,
    val items: List<CreateOrderItemRequest>,
)

data class CreateOrderItemRequest(
    @SerializedName("dishId", alternate = ["dish_id"]) val dishId: Int,
    val quantity: Int,
)

data class UpdateOrderStatusRequest(
    val status: String,
    @SerializedName("cancelReason", alternate = ["cancel_reason"]) val cancelReason: String? = null,
)

// --- Menú --------------------------------------------------------
@Parcelize
data class Menu(
    val id: Int,
    val name: String,
    val description: String? = null,
    @SerializedName("isActive", alternate = ["is_active"]) val isActive: Boolean = true,
    val schedule: @RawValue Any? = null,
    @SerializedName("allowOutsideSchedule", alternate = ["allow_outside_schedule"]) val allowOutsideSchedule: Boolean = true,
    val categories: List<DishCategory>? = null,
) : Parcelable


data class CreateMenuRequest(
    val name: String,
    val description: String? = null,
    val schedule: Any? = null,
    @SerializedName("allowOutsideSchedule", alternate = ["allow_outside_schedule"]) val allowOutsideSchedule: Boolean = true,
)

// --- API Response ------------------------------------------------
data class ApiResponse<T>(
    val data: T? = null,
    val status: Int = 200,
    val message: String? = null,
)

data class KitchenSession(
    val id: Int,
    @SerializedName("chef_id") val chefId: Int,
    @SerializedName("started_at") val startedAt: String,
)

data class UpdateKitchenStatusRequest(val status: String)
data class UpdateItemStatusRequest(val status: String)

// --- API Response Wrappers ------------------------------------------
data class ApiListResponse<T>(
    val data: List<T>,
    val status: Int
)

data class ApiSingleResponse<T>(
    val data: T,
    val status: Int
)

// --- Orden completa con JOINs del backend ---------------------------
data class OrderDto(
    @SerializedName(value = "id")           val id: Int,
    @SerializedName(value = "orderNumber", alternate = ["order_number"])  val orderNumber: String,
    @SerializedName(value = "tableId", alternate = ["table_id"])      val tableId: Int?,
    @SerializedName(value = "tableNumber", alternate = ["table_number"])  val tableNumber: Int?,
    @SerializedName(value = "type")         val type: String,
    @SerializedName(value = "status")       val status: String,
    @SerializedName(value = "kitchenStatus", alternate = ["kitchen_status"]) val kitchenStatus: String,
    @SerializedName(value = "subtotal")     val subtotal: Double,
    @SerializedName(value = "taxAmount", alternate = ["tax_amount"])    val taxAmount: Double,
    @SerializedName(value = "total")        val total: Double,
    @SerializedName(value = "notes")        val notes: String?,
    @SerializedName(value = "customerName", alternate = ["customer_name"]) val customerName: String?,
    @SerializedName(value = "customerPhone", alternate = ["customer_phone"]) val customerPhone: String?,
    @SerializedName(value = "waiterName", alternate = ["waiter_name"]) val waiterName: String?,
    @SerializedName(value = "waiterId", alternate = ["waiter_id"]) val waiterId: Int?,
    @SerializedName(value = "createdAt", alternate = ["created_at"])    val createdAt: String,
    @SerializedName(value = "items")        val items: List<OrderItemDto> = emptyList()
) {
    fun getDisplayTable(): String = 
        if (tableNumber != null) "Mesa $tableNumber" else "Para Llevar"
    
    fun getDisplaySource(): String = when {
        type == "takeout"           -> "Para Llevar"
        tableNumber != null         -> "Mesa $tableNumber"
        else                        -> "Mesa"
    }
    
    fun getDisplayStatus(): String = when {
        kitchenStatus == "ready"     -> "listo"
        status == "preparing"        -> "en_cocina"
        kitchenStatus == "preparing" -> "en_cocina"
        status == "pending"          -> "pendiente"
        status == "delivered"        -> "entregado"
        status == "cancelled"        -> "cancelado"
        else                         -> status
    }

    fun isReady(): Boolean =
        kitchenStatus == "ready" || status == "ready"

    fun isTakeout(): Boolean = type == "takeout"
    fun isDineIn(): Boolean  = type == "dine_in"
}

data class OrderItemDto(
    @SerializedName("id")           val id: Int,
    @SerializedName("dishId")       val dishId: Int,
    @SerializedName("dishName")     val dishName: String,
    @SerializedName("dishImages")   val dishImages: List<String>?,
    @SerializedName("quantity")     val quantity: Int,
    @SerializedName("unitPrice")    val unitPrice: Double,
    @SerializedName("subtotal")     val subtotal: Double,
    @SerializedName("specialNotes") val specialNotes: String?,
    @SerializedName("status")       val status: String
)

// ─── Para escaneo QR ────────────────────────────────────────────────
data class ScanQrResponse(
    @SerializedName("success")     val success: Boolean,
    @SerializedName("orderNumber") val orderNumber: String,
    @SerializedName("total")       val total: Double
)

// ─── DTO para Mesas ─────────────────────────────────────────────────
data class TableDto(
    @SerializedName("id") val id: Int,
    @SerializedName("number") val number: Int,
    @SerializedName("capacity") val capacity: Int = 4,
    @SerializedName("qr_code_url") val qrCodeUrl: String? = null,
    @SerializedName("status") val status: String = "available"
)

// --- Kitchen DTOs --------------------------------------------------
@Parcelize
data class KitchenOrderDto(
    @SerializedName("id")            val id: Int,
    @SerializedName(value = "orderNumber", alternate = ["order_number"])   val orderNumber: String,
    @SerializedName(value = "tableId", alternate = ["table_id"])       val tableId: Int?,
    @SerializedName(value = "tableNumber", alternate = ["table_number"])   val tableNumber: Int?,
    @SerializedName("type")          val type: String,
    @SerializedName(value = "kitchenStatus", alternate = ["kitchen_status"]) val kitchenStatus: String,
    @SerializedName("status")        val status: String,
    @SerializedName(value = "waiterName", alternate = ["waiter_name"])    val waiterName: String?,
    @SerializedName(value = "createdAt", alternate = ["created_at"])     val createdAt: String,
    @SerializedName("items")         val items: List<KitchenOrderItemDto> = emptyList()
) : Parcelable {
    fun getDisplaySource(): String =
        if (tableNumber != null) "Mesa $tableNumber" else "Para Llevar"

    fun getElapsedMinutes(): Long {
        return try {
            val sdf = java.text.SimpleDateFormat(
                "yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
            sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val cleanDate = createdAt.substringBefore(".")
            val created = sdf.parse(cleanDate) ?: return 0L
            (System.currentTimeMillis() - created.time) / 60000L
        } catch (e: Exception) { 0L }
    }

    fun getFormattedElapsedTime(): String {
        val m = getElapsedMinutes()
        return when {
            m < 1  -> "Ahora"
            m < 60 -> "$m min"
            else   -> "${m / 60}h ${m % 60}m"
        }
    }

    // Urgencia según tiempo transcurrido y estado
    fun getUrgencyLevel(): UrgencyLevel = when {
        kitchenStatus == "pending"    && getElapsedMinutes() > 20 -> UrgencyLevel.HIGH
        kitchenStatus == "preparing"  && getElapsedMinutes() > 30 -> UrgencyLevel.MEDIUM
        else -> UrgencyLevel.NORMAL
    }

    fun allItemsReady(): Boolean =
        items.isNotEmpty() && items.all { it.status == "ready" }
}


enum class UrgencyLevel { HIGH, MEDIUM, NORMAL }

@Parcelize
data class KitchenOrderItemDto(
    @SerializedName("id")            val id: Int,
    @SerializedName(value = "dishId", alternate = ["dish_id"])        val dishId: Int,
    @SerializedName(value = "dishName", alternate = ["dish_name"])      val dishName: String,
    @SerializedName("quantity")      val quantity: Int,
    @SerializedName(value = "specialNotes", alternate = ["special_notes"])  val specialNotes: String?,
    @SerializedName("status")        val status: String,
    @SerializedName(value = "startedAt", alternate = ["started_at"])     val startedAt: String?,
    @SerializedName(value = "readyAt", alternate = ["ready_at"])       val readyAt: String?
) : Parcelable

@Parcelize
data class RecipeDto(
    @SerializedName("id")           val id: Int? = null,
    @SerializedName("dishId", alternate = ["dish_id"])       val dishId: Int,
    @SerializedName("prepTimeMin", alternate = ["prep_time_min"])  val prepTimeMin: Int,
    @SerializedName("servings")     val servings: Int,
    @SerializedName("steps")        val steps: List<RecipeStepDto>?,
    @SerializedName("notes")        val notes: String?,
    @SerializedName("ingredients")  val ingredients: List<RecipeIngredientDto> = emptyList()
) : Parcelable

@Parcelize
data class RecipeStepDto(
    @SerializedName("order")       val order: Int,
    @SerializedName("description") val description: String
) : Parcelable

@Parcelize
data class RecipeIngredientDto(
    @SerializedName("id")         val id: Int? = null,
    @SerializedName("itemId", alternate = ["item_id"])     val itemId: Int? = null,
    @SerializedName("name")       val name: String,
    @SerializedName("quantity")   val quantity: Double,
    @SerializedName("unit")       val unit: String,
    @SerializedName("isOptional", alternate = ["is_optional"]) val isOptional: Boolean = false
) : Parcelable


@Parcelize
data class DishWithRecipeDto(
    @SerializedName("id")          val id: Int,
    @SerializedName("name")        val name: String,
    @SerializedName("description") val description: String?,
    @SerializedName("images")      val images: List<String>?,
    @SerializedName("prepTimeMin") val prepTimeMin: Int?,
    @SerializedName("categoryName", alternate = ["category_name", "category_label"]) val categoryName: String?,
    @SerializedName("recipe")      val recipe: RecipeDto?
) : Parcelable

@Parcelize
data class KitchenStatsDto(
    @SerializedName("completedToday")    val completedToday: Int,
    @SerializedName("avgPrepTimeMin")    val avgPrepTimeMin: Double,
    @SerializedName("activeSession")     val activeSession: KitchenSessionDto?
) : Parcelable

@Parcelize
data class KitchenSessionDto(
    @SerializedName("id")        val id: Int,
    @SerializedName("startedAt") val startedAt: String,
    @SerializedName("endedAt")   val endedAt: String?
) : Parcelable

// ─── Staff Performance ───────────────────────────────────────────
@Parcelize
data class StaffMetricDto(
    val waiterId: Int,
    val waiterName: String,
    val orderCount: Int,
    val totalRevenue: Double
) : Parcelable
