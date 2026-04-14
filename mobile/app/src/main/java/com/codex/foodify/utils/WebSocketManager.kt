// RUTA: app/src/main/java/com/codex/foodify/utils/WebSocketManager.kt
// Socket.io singleton — namespaces /kitchen y /restaurant
// Solo Plan Premium. Autenticación con Bearer JWT en el handshake.
package com.codex.foodify.utils

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.stringPreferencesKey
import com.codex.foodify.BuildConfig
import com.codex.foodify.data.api.ACCESS_TOKEN_KEY
import com.codex.foodify.data.api.dataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.net.URI
import javax.inject.Inject
import javax.inject.Singleton

typealias SocketEventHandler = (JSONObject?) -> Unit

@Singleton
class WebSocketManager @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val TAG = "WebSocketManager"
    private val baseWsUrl = BuildConfig.BASE_URL
        .replace("/api/v1/", "")
        .replace("http://", "ws://")
        .replace("https://", "wss://")

    private var kitchenSocket:    Socket? = null
    private var restaurantSocket: Socket? = null

    // ── Listeners registrados externamente ────────────────────────
    private val orderNewListeners       = mutableListOf<SocketEventHandler>()
    private val orderCancelledListeners = mutableListOf<SocketEventHandler>()
    private val orderReadyListeners     = mutableListOf<SocketEventHandler>()
    private val orderStatusListeners    = mutableListOf<SocketEventHandler>()
    private val orderFinalizedListeners = mutableListOf<SocketEventHandler>()
    private val orderUpdatedListeners   = mutableListOf<SocketEventHandler>()
    private val orderNewNotifListeners  = mutableListOf<SocketEventHandler>()
    private val inventoryAlertListeners = mutableListOf<SocketEventHandler>()
    private val dishUnavailListeners    = mutableListOf<SocketEventHandler>()

    // ── JWT ───────────────────────────────────────────────────────
    private val jwtToken: String
        get() = runBlocking {
            context.dataStore.data.firstOrNull()?.get(ACCESS_TOKEN_KEY) ?: ""
        }

    // ── Conectar /kitchen (Chef) ──────────────────────────────────
    fun connectKitchen() {
        if (kitchenSocket?.connected() == true) return
        val opts = buildOptions()
        kitchenSocket = IO.socket(URI.create("$baseWsUrl/kitchen"), opts)
        kitchenSocket?.apply {
            on(Socket.EVENT_CONNECT)    { Log.d(TAG, "/kitchen connected") }
            on(Socket.EVENT_DISCONNECT) { Log.d(TAG, "/kitchen disconnected") }
            on(Socket.EVENT_CONNECT_ERROR) { args -> Log.e(TAG, "Kitchen error: ${args[0]}") }

            // order:new → chef ve nueva comanda
            on("order:new") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderNewListeners.forEach { it(data) }
            }
            // order:cancelled → retirar del board
            on("order:cancelled") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderCancelledListeners.forEach { it(data) }
            }
            // order:finalized → retirar del board (entregado por cajero)
            on("order:finalized") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderFinalizedListeners.forEach { it(data) }
            }
            connect()
        }
    }

    // ── Conectar /restaurant (Waiter, Admin, Cashier) ─────────────
    fun connectRestaurant() {
        if (restaurantSocket?.connected() == true) return
        val opts = buildOptions()
        restaurantSocket = IO.socket(URI.create("$baseWsUrl/restaurant"), opts)
        restaurantSocket?.apply {
            on(Socket.EVENT_CONNECT)    { Log.d(TAG, "/restaurant connected") }
            on(Socket.EVENT_DISCONNECT) { Log.d(TAG, "/restaurant disconnected") }

            // order:ready → pedido listo para entregar (+ push FCM al mesero)
            on("order:ready") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderReadyListeners.forEach { it(data) }
            }
            // order:status → cambio de estado del pedido
            on("order:status") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderStatusListeners.forEach { it(data) }
            }
            // inventory:alert → stock bajo o insumo caducando
            on("inventory:alert") { args ->
                val data = args.getOrNull(0) as? JSONObject
                inventoryAlertListeners.forEach { it(data) }
            }
            // dish:unavailable → platillo auto-desactivado por stock 0
            on("dish:unavailable") { args ->
                val data = args.getOrNull(0) as? JSONObject
                dishUnavailListeners.forEach { it(data) }
            }
            // order:updated → asignación de mesero o cambio en ítems
            on("order:updated") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderUpdatedListeners.forEach { it(data) }
            }
            // order:new_notification → alerta global de pedido PWA
            on("order:new_notification") { args ->
                val data = args.getOrNull(0) as? JSONObject
                orderNewNotifListeners.forEach { it(data) }
            }
            connect()
        }
    }

    // ── Emitir eventos desde el Chef ──────────────────────────────
    fun emitItemStart(orderItemId: Int) {
        kitchenSocket?.emit("order:item:start", JSONObject().put("orderItemId", orderItemId))
    }

    fun emitItemReady(orderItemId: Int) {
        kitchenSocket?.emit("order:item:ready", JSONObject().put("orderItemId", orderItemId))
    }

    // ── Registrar / desregistrar listeners ────────────────────────
    fun onOrderNew(handler: SocketEventHandler)         { orderNewListeners.add(handler) }
    fun onOrderCancelled(handler: SocketEventHandler)   { orderCancelledListeners.add(handler) }
    fun onOrderReady(handler: SocketEventHandler)       { orderReadyListeners.add(handler) }
    fun onOrderStatus(handler: SocketEventHandler)      { orderStatusListeners.add(handler) }
    fun onInventoryAlert(handler: SocketEventHandler)   { inventoryAlertListeners.add(handler) }
    fun onDishUnavailable(handler: SocketEventHandler)  { dishUnavailListeners.add(handler) }
    fun onOrderFinalized(handler: SocketEventHandler)   { orderFinalizedListeners.add(handler) }
    fun onOrderUpdated(handler: SocketEventHandler)     { orderUpdatedListeners.add(handler) }
    fun onOrderNewNotification(handler: SocketEventHandler) { orderNewNotifListeners.add(handler) }

    fun offOrderNew(handler: SocketEventHandler)         { orderNewListeners.remove(handler) }
    fun offOrderCancelled(handler: SocketEventHandler)   { orderCancelledListeners.remove(handler) }
    fun offOrderReady(handler: SocketEventHandler)       { orderReadyListeners.remove(handler) }
    fun offOrderStatus(handler: SocketEventHandler)      { orderStatusListeners.remove(handler) }
    fun offInventoryAlert(handler: SocketEventHandler)   { inventoryAlertListeners.remove(handler) }
    fun offDishUnavailable(handler: SocketEventHandler)  { dishUnavailListeners.remove(handler) }
    fun offOrderFinalized(handler: SocketEventHandler)   { orderFinalizedListeners.remove(handler) }
    fun offOrderUpdated(handler: SocketEventHandler)     { orderUpdatedListeners.remove(handler) }
    fun offOrderNewNotification(handler: SocketEventHandler) { orderNewNotifListeners.remove(handler) }

    fun removeAllListeners() {
        orderNewListeners.clear(); orderCancelledListeners.clear()
        orderReadyListeners.clear(); orderStatusListeners.clear()
        orderFinalizedListeners.clear()
        orderUpdatedListeners.clear(); orderNewNotifListeners.clear()
        inventoryAlertListeners.clear(); dishUnavailListeners.clear()
    }

    // ── Desconectar ───────────────────────────────────────────────
    fun disconnect() {
        kitchenSocket?.disconnect();    kitchenSocket = null
        restaurantSocket?.disconnect(); restaurantSocket = null
        removeAllListeners()
        Log.d(TAG, "WebSockets desconectados")
    }

    fun isKitchenConnected()    = kitchenSocket?.connected() == true
    fun isRestaurantConnected() = restaurantSocket?.connected() == true

    // ── Helpers ───────────────────────────────────────────────────
    private fun buildOptions() = IO.Options.builder()
        .setAuth(mapOf("token" to jwtToken))
        .setExtraHeaders(mapOf("Authorization" to listOf("Bearer $jwtToken")))
        .setTransports(arrayOf("websocket"))
        .setReconnection(true)
        .setReconnectionAttempts(5)
        .setReconnectionDelay(2000)
        .build()
}
