// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/tables/TablesAdapter.kt
// Grid de mesas — punto de color en esquina superior derecha según estado
package com.codex.foodify.ui.waiter.tables

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.Table
import com.codex.foodify.databinding.ItemTableBinding

class TablesAdapter(
    private val onClick: (Table) -> Unit,
) : ListAdapter<Table, TablesAdapter.VH>(DiffCb()) {

    inner class VH(val b: ItemTableBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(table: Table) {
            b.tvTableNumber.text   = "Mesa ${table.number}"
            b.tvTableCapacity.text = "${table.capacity} personas"
            b.tvTableStatus.text   = table.displayStatus

            val statusColor = when (table.status) {
                "available" -> R.color.status_available
                "occupied"  -> R.color.status_occupied
                "reserved"  -> R.color.status_reserved
                "cleaning"  -> R.color.status_cleaning
                else        -> R.color.text_low_light
            }
            // Punto de estado en esquina superior derecha
            b.viewStatusDot.setBackgroundTintList(b.root.context.getColorStateList(statusColor))
            b.tvTableStatus.setTextColor(b.root.context.getColor(statusColor))

            // Mostrar botón "+" solo en mesas disponibles
            b.btnNewOrder.visibility =
                if (table.status == "available") android.view.View.VISIBLE else android.view.View.GONE

            b.root.setOnClickListener { onClick(table) }
            b.btnNewOrder.setOnClickListener { onClick(table) }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemTableBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<Table>() {
        override fun areItemsTheSame(a: Table, b: Table) = a.id == b.id
        override fun areContentsTheSame(a: Table, b: Table) = a == b
    }
}
