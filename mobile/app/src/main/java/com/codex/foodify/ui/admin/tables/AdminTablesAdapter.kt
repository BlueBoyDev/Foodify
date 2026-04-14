package com.codex.foodify.ui.admin.tables

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.Table
import com.codex.foodify.databinding.ItemAdminTableBinding

class AdminTablesAdapter(
    private val onDeleteClick: (Table) -> Unit
) : ListAdapter<Table, AdminTablesAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemAdminTableBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val table = getItem(position)
        holder.bind(table)
    }

    inner class ViewHolder(private val binding: ItemAdminTableBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(table: Table) {
            binding.tvTableNumber.text = "Mesa ${table.number}"
            binding.tvTableDetails.text = "Capacidad: ${table.capacity} personas"
            
            binding.btnDeleteTable.setOnClickListener {
                onDeleteClick(table)
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<Table>() {
        override fun areItemsTheSame(oldItem: Table, newItem: Table): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Table, newItem: Table): Boolean =
            oldItem == newItem
    }
}
