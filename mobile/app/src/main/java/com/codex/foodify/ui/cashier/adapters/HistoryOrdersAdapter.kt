// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/adapters/HistoryOrdersAdapter.kt
package com.codex.foodify.ui.cashier.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.OrderDto
import com.codex.foodify.data.model.OrderItemDto
import com.codex.foodify.databinding.ItemHistoryOrderCardBinding
import com.codex.foodify.databinding.ItemOrderItemSimpleBinding
import java.text.SimpleDateFormat
import java.util.Locale

class HistoryOrdersAdapter : ListAdapter<OrderDto, HistoryOrdersAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemHistoryOrderCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemHistoryOrderCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(order: OrderDto) {
            // Tipo
            if (order.isDineIn()) {
                binding.typeIcon.setImageResource(R.drawable.ic_fork)
                binding.typeLabel.text = "Mesa ${order.tableNumber}"
            } else {
                binding.typeIcon.setImageResource(R.drawable.ic_bag)
                binding.typeLabel.text = "Para Llevar"
            }

            // Badge status
            val (badgeText, badgeColor) = if (order.status == "delivered") {
                "✓ Entregado" to R.color.success_green
            } else {
                "⊗ Cancelado" to R.color.error_red
            }
            binding.statusBadge.text = badgeText
            binding.statusBadge.setBackgroundColor(
                itemView.context.getColor(badgeColor)
            )

            // Fecha y folio
            binding.orderDate.text = formatOrderDate(order.createdAt)
            binding.orderNumber.text = "Folio: #${order.orderNumber}"

            // Total
            binding.totalAmount.text = String.format("$%.2f", order.total)

            // Items
            val itemsAdapter = OrderItemsAdapter()
            binding.itemsRecycler.apply {
                layoutManager = LinearLayoutManager(itemView.context)
                adapter = itemsAdapter
            }
            itemsAdapter.submitList(order.items)
        }

        private fun formatOrderDate(isoDate: String): String {
            return try {
                val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val date = sdf.parse(isoDate) ?: return isoDate.take(10)
                val outFmt = SimpleDateFormat("dd/MM/yyyy, hh:mm a", Locale.getDefault())
                outFmt.format(date)
            } catch (e: Exception) {
                isoDate.take(10)
            }
        }
    }

    private class OrderItemsAdapter : ListAdapter<OrderItemDto, OrderItemsAdapter.ItemViewHolder>(
        object : DiffUtil.ItemCallback<OrderItemDto>() {
            override fun areItemsTheSame(oldItem: OrderItemDto, newItem: OrderItemDto) =
                oldItem.id == newItem.id

            override fun areContentsTheSame(oldItem: OrderItemDto, newItem: OrderItemDto) =
                oldItem == newItem
        }
    ) {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ItemViewHolder {
            val binding = ItemOrderItemSimpleBinding.inflate(
                LayoutInflater.from(parent.context), parent, false
            )
            return ItemViewHolder(binding)
        }

        override fun onBindViewHolder(holder: ItemViewHolder, position: Int) {
            holder.bind(getItem(position))
        }

        inner class ItemViewHolder(private val binding: ItemOrderItemSimpleBinding) :
            RecyclerView.ViewHolder(binding.root) {

            fun bind(item: OrderItemDto) {
                binding.itemLabel.text = "[${item.quantity}]x ${item.dishName}"
                binding.itemSubtotal.text = String.format("$%.2f", item.subtotal)
            }
        }
    }

    companion object {
        private val DiffCallback = object : DiffUtil.ItemCallback<OrderDto>() {
            override fun areItemsTheSame(oldItem: OrderDto, newItem: OrderDto) =
                oldItem.id == newItem.id

            override fun areContentsTheSame(oldItem: OrderDto, newItem: OrderDto) =
                oldItem == newItem
        }
    }
}

