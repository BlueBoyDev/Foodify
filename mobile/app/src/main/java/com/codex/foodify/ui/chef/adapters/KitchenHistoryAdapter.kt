package com.codex.foodify.ui.chef.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.KitchenOrderDto
import com.codex.foodify.databinding.ItemKitchenHistoryCardBinding
import java.text.SimpleDateFormat
import java.util.*

class KitchenHistoryAdapter(
    private val onArchiveClick: (KitchenOrderDto) -> Unit
) : ListAdapter<KitchenOrderDto, KitchenHistoryAdapter.ViewHolder>(DiffCallback) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemKitchenHistoryCardBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemKitchenHistoryCardBinding) :
        RecyclerView.ViewHolder(binding.root) {

        private val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        private val outputFormat = SimpleDateFormat("hh:mm a", Locale.getDefault())

        fun bind(order: KitchenOrderDto) {
            val context = binding.root.context
            
            binding.tvOrderNum.text = "Folio: #${order.orderNumber}"
            
            val statusStr = order.status.uppercase()
            binding.tvStatus.text = statusStr
            
            if (statusStr == "CANCELLED") {
                binding.tvStatus.setTextColor(context.getColor(R.color.status_cancelled_text))
                binding.tvStatus.backgroundTintList = context.getColorStateList(R.color.status_cancelled_bg)
            } else {
                binding.tvStatus.setTextColor(context.getColor(R.color.status_delivered_text))
                binding.tvStatus.backgroundTintList = context.getColorStateList(R.color.status_delivered_bg)
            }

            try {
                val date = inputFormat.parse(order.createdAt)
                binding.tvTimestamp.text = outputFormat.format(date!!)
            } catch (e: Exception) {
                binding.tvTimestamp.text = "--:--"
            }

            val itemsSummary = order.items.joinToString(", ") { "${it.quantity}x ${it.dishName}" }
            binding.tvItemsSummary.text = itemsSummary
            binding.tvWaiter.text = "Mesero: ${order.waiterName}"

            binding.btnArchive.setOnClickListener { onArchiveClick(order) }
        }
    }

    companion object DiffCallback : DiffUtil.ItemCallback<KitchenOrderDto>() {
        override fun areItemsTheSame(oldItem: KitchenOrderDto, newItem: KitchenOrderDto): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: KitchenOrderDto, newItem: KitchenOrderDto): Boolean {
            return oldItem == newItem
        }
    }
}
