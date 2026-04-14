// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dashboard/StaffPerformanceAdapter.kt
package com.codex.foodify.ui.admin.dashboard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.StaffMetricDto

class StaffPerformanceAdapter : 
    ListAdapter<StaffMetricDto, StaffPerformanceAdapter.ViewHolder>(StaffDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_staff_performance, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val tvName:    TextView = itemView.findViewById(R.id.tv_staff_name)
        private val tvOrders:  TextView = itemView.findViewById(R.id.tv_staff_orders)
        private val tvRevenue: TextView = itemView.findViewById(R.id.tv_staff_revenue)

        fun bind(metric: StaffMetricDto) {
            tvName.text    = metric.waiterName
            tvOrders.text  = "${metric.orderCount} pedidos"
            tvRevenue.text = "$${"%.2f".format(metric.totalRevenue)}"
        }
    }

    class StaffDiffCallback : DiffUtil.ItemCallback<StaffMetricDto>() {
        override fun areItemsTheSame(oldItem: StaffMetricDto, newItem: StaffMetricDto) = 
            oldItem.waiterId == newItem.waiterId
        override fun areContentsTheSame(oldItem: StaffMetricDto, newItem: StaffMetricDto) = 
            oldItem == newItem
    }
}
