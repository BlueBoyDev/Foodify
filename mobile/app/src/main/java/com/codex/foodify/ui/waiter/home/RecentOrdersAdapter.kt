// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/home/RecentOrdersAdapter.kt
// Lista de pedidos recientes en el home del mesero (imagen 12)
package com.codex.foodify.ui.waiter.home

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.Order
import com.codex.foodify.databinding.ItemRecentOrderBinding

class RecentOrdersAdapter(
    private val onClick: (Order) -> Unit,
) : ListAdapter<Order, RecentOrdersAdapter.VH>(DiffCb()) {

    inner class VH(val b: ItemRecentOrderBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(order: Order) {
            b.tvTableLabel.text   = if (order.table != null) "Mesa ${order.table.number}" else "Para Llevar"
            b.tvItemCount.text    = "${order.items?.size ?: 0} platillos"
            b.tvOrderTime.text    = formatTime(order.createdAt)
            b.tvOrderStatus.text  = order.displayKitchenStatus

            val statusColor = when (order.kitchenStatus) {
                "pending"   -> R.color.surface_light
                "preparing" -> R.color.surface_light
                "ready"     -> R.color.surface_light
                "delivered" -> R.color.surface_light
                else        -> R.color.surface_light
            }
            val statusBg = when (order.kitchenStatus) {
                "pending"   -> R.color.order_pending
                "preparing" -> R.color.order_preparing
                "ready"     -> R.color.order_ready
                "delivered" -> R.color.order_delivered
                else        -> R.color.order_pending
            }
            b.tvOrderStatus.setTextColor(ContextCompat.getColor(b.root.context, statusColor))
            b.tvOrderStatus.setBackgroundTintList(b.root.context.getColorStateList(statusBg))
            b.root.setOnClickListener { onClick(order) }
        }

        private fun formatTime(createdAt: String): String {
            // Calcular tiempo transcurrido
            return try {
                val sdf = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault())
                sdf.timeZone = java.util.TimeZone.getTimeZone("UTC")
                val date = sdf.parse(createdAt) ?: return "Ahora"
                val diff = (System.currentTimeMillis() - date.time) / 60000
                when {
                    diff < 1  -> "Ahora"
                    diff < 60 -> "${diff} min"
                    else      -> "${diff / 60}h"
                }
            } catch (_: Exception) { "Ahora" }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemRecentOrderBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<Order>() {
        override fun areItemsTheSame(a: Order, b: Order) = a.id == b.id
        override fun areContentsTheSame(a: Order, b: Order) = a == b
    }
}
