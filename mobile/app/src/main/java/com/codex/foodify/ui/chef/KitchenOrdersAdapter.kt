package com.codex.foodify.ui.chef

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.KitchenOrderDto
import com.codex.foodify.data.model.UrgencyLevel
import com.codex.foodify.databinding.ItemKitchenOrderCardBinding

class KitchenOrdersAdapter(
    private val onStartOrder: (KitchenOrderDto) -> Unit,
    private val onReadyOrder: (KitchenOrderDto) -> Unit,
    private val onDetails: (KitchenOrderDto) -> Unit
) : ListAdapter<KitchenOrderDto, KitchenOrdersAdapter.OrderViewHolder>(OrderDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemKitchenOrderCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class OrderViewHolder(private val binding: ItemKitchenOrderCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(order: KitchenOrderDto) {
            binding.tvOrderNumber.text = "#${order.orderNumber}"
            binding.tvSource.text = order.getDisplaySource()
            binding.tvWaiter.text = order.waiterName ?: "Foodify"
            binding.tvTimer.text = order.getFormattedElapsedTime()

            // Aplicar urgencia visual
            val urgency = order.getUrgencyLevel()
            binding.cardOrder.strokeWidth = if (urgency != UrgencyLevel.NORMAL) 4 else 0
            binding.cardOrder.strokeColor = when(urgency) {
                UrgencyLevel.HIGH -> binding.root.context.getColor(R.color.urgent_red)
                UrgencyLevel.MEDIUM -> binding.root.context.getColor(R.color.urgent_orange)
                else -> 0
            }

            // Configurar botón de acción principal y Badge de estado
            when (order.kitchenStatus) {
                "pending" -> {
                    binding.tvStatusBadge.text = "Pendiente"
                    binding.tvStatusBadge.setBackgroundResource(R.drawable.status_pending_bg)
                    binding.btnAction.text = "Iniciar"
                    binding.btnAction.isEnabled = true
                    binding.btnAction.setOnClickListener { onStartOrder(order) }
                }
                "preparing" -> {
                    binding.tvStatusBadge.text = "En Cocina"
                    binding.tvStatusBadge.setBackgroundResource(R.drawable.status_preparing_bg)
                    binding.btnAction.text = "Listo"
                    binding.btnAction.isEnabled = true
                    binding.btnAction.setOnClickListener { onReadyOrder(order) }
                }
                "ready" -> {
                    binding.tvStatusBadge.text = "Listo"
                    binding.tvStatusBadge.setBackgroundResource(R.drawable.status_ready_bg)
                    binding.btnAction.text = "Esperando Recogida"
                    binding.btnAction.isEnabled = false
                }
                "delivered" -> {
                    binding.tvStatusBadge.text = "Entregado"
                    binding.tvStatusBadge.setBackgroundResource(R.drawable.status_delivered_bg)
                    binding.btnAction.visibility = View.GONE
                }
            }

            binding.btnDetails.setOnClickListener { onDetails(order) }

            // Configurar items rápidos (máximo 3)
            val itemNames = order.items.joinToString("\n") { 
                "- ${it.quantity}x ${it.dishName}" 
            }
            // En una app real usaríamos un RecyclerView interno para mayor control
            // Aquí lo simplificamos por ahora o implementamos el sub-RV
        }
    }

    class OrderDiffCallback : DiffUtil.ItemCallback<KitchenOrderDto>() {
        override fun areItemsTheSame(oldItem: KitchenOrderDto, newItem: KitchenOrderDto) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: KitchenOrderDto, newItem: KitchenOrderDto) = oldItem == newItem
    }
}
