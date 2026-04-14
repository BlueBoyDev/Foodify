// RUTA: app/src/main/java/com/codex/foodify/ui/chef/KitchenAdapter.kt
// Card de comanda con borde de urgencia + checkboxes por ítem
// Borde ROJO = pending > 20 min | Borde NARANJA = preparing > 30 min
package com.codex.foodify.ui.chef

import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.*
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.KitchenOrderDto
import com.codex.foodify.data.model.KitchenOrderItemDto
import com.codex.foodify.databinding.ItemKitchenOrderBinding
import java.text.SimpleDateFormat
import java.util.*

class KitchenAdapter(
    private val onStartOrder : (KitchenOrderDto) -> Unit,
    private val onReadyOrder : (KitchenOrderDto) -> Unit,
    private val onItemStatus : (Int, String) -> Unit,
    private val onEdit       : (KitchenOrderDto) -> Unit,
    private val onRecipeClick: (Int) -> Unit = {}
) : ListAdapter<KitchenOrderDto, KitchenAdapter.VH>(DiffCb()) {

    private val handler = Handler(Looper.getMainLooper())
    private val tickRunnable = object : Runnable {
        override fun run() {
            notifyDataSetChanged()          // recalcular colores de urgencia
            handler.postDelayed(this, 30_000L)
        }
    }

    fun startTicking() { handler.post(tickRunnable) }
    fun stopTicking()  { handler.removeCallbacks(tickRunnable) }

    inner class VH(val b: ItemKitchenOrderBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(order: KitchenOrderDto) {
            b.tvOrderNumber.text  = "#${order.orderNumber}"
            b.tvTableLabel.text   = order.tableNumber?.let { "Mesa $it" } ?: "Para Llevar"
            b.tvWaiterName.text   = order.waiterName ?: "Mesero"
            b.tvItemCount.text    = "${order.items.size} platillos"
            b.tvElapsedTime.text  = order.getFormattedElapsedTime()

            val elapsed = order.getElapsedMinutes()

            // ── Colores de urgencia ────────────────────────────────
            val (strokeColor, strokeWidth) = when {
                order.kitchenStatus == "pending"   && elapsed > 20 ->
                    Pair(R.color.urgent_red,    4)
                order.kitchenStatus == "preparing" && elapsed > 30 ->
                    Pair(R.color.urgent_orange, 4)
                else ->
                    Pair(R.color.divider_light, 1)
            }
            b.cardOrder.strokeColor = b.root.context.getColor(strokeColor)
            b.cardOrder.strokeWidth = strokeWidth

            // ── Badge de estado de cocina ──────────────────────────
            val statusColor = when (order.kitchenStatus) {
                "pending"   -> R.color.order_pending
                "preparing" -> R.color.order_preparing
                "ready"     -> R.color.order_ready
                "delivered" -> R.color.order_delivered
                else        -> R.color.order_pending
            }
            var statusText = when (order.kitchenStatus) {
                "pending"   -> "Pendiente"
                "preparing" -> "En Cocina"
                "ready"     -> "Listo"
                "delivered" -> "Entregado"
                else        -> order.kitchenStatus
            }

            if (order.getUrgencyLevel() == com.codex.foodify.data.model.UrgencyLevel.HIGH) {
                statusText = "¡PRIORIDAD! $statusText"
            }

            b.tvKitchenStatus.text = statusText
            b.tvKitchenStatus.setBackgroundTintList(b.root.context.getColorStateList(statusColor))

            // ── Ítems de la comanda ────────────────────────────────
            order.items?.let { items ->
                b.rvOrderItems.layoutManager = LinearLayoutManager(b.root.context)
                b.rvOrderItems.adapter = KitchenItemAdapter(items, { itemId, newStatus ->
                    onItemStatus(itemId, newStatus)
                }, onRecipeClick)
            }

            // ── Botones de acción ────────────────────────
            when (order.kitchenStatus) {
                "pending" -> {
                    b.btnAction.text       = "Iniciar Preparación"
                    b.btnAction.visibility = View.VISIBLE
                    b.btnAction.setOnClickListener { onStartOrder(order) }
                }
                "preparing" -> {
                    val allReady = order.items?.all {
                        it.status == "ready" || it.status == "served"
                    } == true
                    b.btnAction.text       = "Finalizar Comanda"
                    b.btnAction.visibility = if (allReady) View.VISIBLE else View.VISIBLE
                    b.btnAction.isEnabled  = allReady
                    if (!allReady) {
                        b.btnAction.alpha = 0.5f
                        b.btnAction.text = "Items pendientes..."
                    } else {
                        b.btnAction.alpha = 1.0f
                    }
                    b.btnAction.setOnClickListener { onReadyOrder(order) }
                }
                "ready" -> {
                    b.btnAction.text       = "Comanda Lista"
                    b.btnAction.visibility = View.VISIBLE
                    b.btnAction.isEnabled  = false
                    b.btnAction.alpha      = 0.7f
                }
                else -> b.btnAction.visibility = View.GONE
            }

            // Botón editar siempre visible excepto si ya se entregó
            if (order.status != "delivered") {
                b.btnEdit.visibility = View.VISIBLE
                b.btnEdit.setOnClickListener { onEdit(order) }
            } else {
                b.btnEdit.visibility = View.GONE
            }

            // ── Notas especiales ──────────────────────────────────
            val hasNotes = order.items?.any { !it.specialNotes.isNullOrEmpty() } == true
            b.tvSpecialNotes.visibility = if (hasNotes) View.VISIBLE else View.GONE
            if (hasNotes) {
                val notes = order.items
                    ?.filter { !it.specialNotes.isNullOrEmpty() }
                    ?.joinToString("\n") { "- ${it.dishName}: ${it.specialNotes}" }
                b.tvSpecialNotes.text = notes
            }
        }

        // El tiempo se maneja vía order.getFormattedElapsedTime()
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemKitchenOrderBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<KitchenOrderDto>() {
        override fun areItemsTheSame(a: KitchenOrderDto, b: KitchenOrderDto) = a.id == b.id
        override fun areContentsTheSame(a: KitchenOrderDto, b: KitchenOrderDto) = a == b
    }
}

// ── Sub-adapter para ítems de la comanda ──────────────────────────
class KitchenItemAdapter(
    private val items: List<KitchenOrderItemDto>,
    private val onStatusChange: (Int, String) -> Unit,
    private val onRecipeClick: (Int) -> Unit
) : RecyclerView.Adapter<KitchenItemAdapter.VH>() {

    inner class VH(val b: com.codex.foodify.databinding.ItemKitchenOrderItemBinding)
        : RecyclerView.ViewHolder(b.root) {
        fun bind(item: KitchenOrderItemDto) {
            b.tvItemName.text     = "${item.quantity}x ${item.dishName}"
            b.tvItemNotes.text    = item.specialNotes ?: ""
            b.tvItemNotes.visibility = if (item.specialNotes.isNullOrEmpty()) View.GONE else View.VISIBLE

            b.tvItemName.setOnClickListener { onRecipeClick(item.dishId) }

            b.cbItemReady.setOnCheckedChangeListener(null)
            b.cbItemReady.isChecked = item.status == "ready"

            b.cbItemReady.setOnCheckedChangeListener { _, checked ->
                val newStatus = if (checked) "ready" else "preparing"
                onStatusChange(item.id, newStatus)
            }

            val statusColor = when (item.status) {
                "pending"   -> Color.parseColor("#6B7280")
                "preparing" -> Color.parseColor("#3B82F6")
                "ready",
                "served"    -> Color.parseColor("#22C55E")
                else        -> Color.parseColor("#6B7280")
            }
            b.viewItemStatus.setBackgroundColor(statusColor)
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(com.codex.foodify.databinding.ItemKitchenOrderItemBinding
            .inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(items[pos])
    override fun getItemCount() = items.size
}
