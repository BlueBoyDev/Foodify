// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierOrdersAdapter.kt
package com.codex.foodify.ui.cashier

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.OrderDto // Changed from Order
import com.codex.foodify.databinding.ItemCashierOrderBinding

class CashierOrdersAdapter(
    private val onScanQr  : (OrderDto) -> Unit,
    private val onDeliver : (OrderDto) -> Unit,
    private val onEdit    : (OrderDto) -> Unit,
) : ListAdapter<OrderDto, CashierOrdersAdapter.VH>(DiffCb()) {

    inner class VH(val b: ItemCashierOrderBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(order: OrderDto) {
            b.tvOrderNumber.text = "#${order.orderNumber}"
            b.tvOrderType.text   = order.getDisplaySource()
            b.tvOrderTotal.text  = "$${"%.2f".format(order.total)}"
            b.tvOrderStatus.text = order.getDisplayStatus()
            b.tvItemCount.text   = "${order.items.size} platillos"

            val statusColor = when (order.kitchenStatus) {
                "ready"     -> R.color.order_ready
                "preparing" -> R.color.order_preparing
                else        -> R.color.order_pending
            }
            b.tvOrderStatus.setBackgroundTintList(b.root.context.getColorStateList(statusColor))

            // Botón editar siempre visible excepto si ya se entregó
            if (order.status != "delivered") {
                b.btnEdit.visibility = View.VISIBLE
                b.btnEdit.setOnClickListener { onEdit(order) }
            } else {
                b.btnEdit.visibility = View.GONE
            }

            // Mostrar botón QR solo para órdenes Para Llevar y listas
            if (order.isTakeout() && order.isReady()) {
                b.btnScanQr.visibility  = View.VISIBLE
                b.btnDeliver.visibility = View.GONE
                b.btnScanQr.setOnClickListener { onScanQr(order) }
            } else if (order.isDineIn() && order.isReady()) { // Para órdenes en mesa y listas
                b.btnDeliver.visibility = View.VISIBLE
                b.btnScanQr.visibility  = View.GONE
                b.btnDeliver.setOnClickListener { onDeliver(order) }
            } else {
                b.btnScanQr.visibility  = View.GONE
                b.btnDeliver.visibility = View.GONE
            }

            // Nombre del cliente para Para Llevar
            if (!order.customerName.isNullOrEmpty()) {
                b.tvCustomerName.text       = order.customerName
                b.tvCustomerName.visibility = View.VISIBLE
            } else {
                b.tvCustomerName.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemCashierOrderBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<OrderDto>() { // Changed to OrderDto
        override fun areItemsTheSame(a: OrderDto, b: OrderDto) = a.id == b.id
        override fun areContentsTheSame(a: OrderDto, b: OrderDto) = a == b
    }
}
