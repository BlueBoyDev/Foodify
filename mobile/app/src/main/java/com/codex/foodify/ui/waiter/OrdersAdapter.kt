// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/OrdersAdapter.kt
package com.codex.foodify.ui.waiter

import android.graphics.Color
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.OrderDto
import com.codex.foodify.utils.StatusUtils
import com.google.android.material.chip.Chip
import java.text.SimpleDateFormat
import java.util.*

class OrdersAdapter(
    private val onEdit: (OrderDto) -> Unit = {},
    private val onClaim: (OrderDto) -> Unit = {}
) : ListAdapter<OrderDto, OrdersAdapter.ViewHolder>(OrderDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_order_card, parent, false)
        return ViewHolder(view, onEdit, onClaim)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        itemView: View, 
        private val onEdit: (OrderDto) -> Unit,
        private val onClaim: (OrderDto) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        private val tvMesa: TextView = itemView.findViewById(R.id.tvMesa)
        private val tvFecha: TextView = itemView.findViewById(R.id.tvFecha)
        private val tvWaiter: TextView = itemView.findViewById(R.id.tvWaiter)
        private val chipStatus: Chip = itemView.findViewById(R.id.chipStatus)
        private val itemsContainer: LinearLayout = itemView.findViewById(R.id.itemsContainer)
        private val tvTotal: TextView = itemView.findViewById(R.id.tvTotal)
        private val btnEdit: View = itemView.findViewById(R.id.btnEdit)
        private val btnClaim: View = itemView.findViewById(R.id.btnClaim)

        fun bind(order: OrderDto) {
            // Mesa
            tvMesa.text = order.getDisplayTable()

            // Fecha
            tvFecha.text = formatDate(order.createdAt)

            // Status chip
            val displayStatus = order.getDisplayStatus()
            StatusUtils.applyToChip(chipStatus, displayStatus)

            // Mesero asignado
            if (order.waiterName != null) {
                tvWaiter.visibility = View.VISIBLE
                tvWaiter.text = "Mesero: ${order.waiterName}"
                tvWaiter.setTextColor(itemView.context.getColor(R.color.text_secondary))
            } else if (order.isTakeout()) {
                tvWaiter.visibility = View.VISIBLE
                tvWaiter.text = "Mesero: Por asignar"
                tvWaiter.setTextColor(itemView.context.getColor(R.color.foodify_orange))
            } else {
                tvWaiter.visibility = View.GONE
            }

            // Lógica de botones (Editar / Atender)
            val isTakeoutUnassigned = order.isTakeout() && order.waiterName == null

            if (isTakeoutUnassigned) {
                btnClaim.visibility = View.VISIBLE
                btnClaim.setOnClickListener { onClaim(order) }
                btnEdit.visibility = View.GONE
            } else {
                btnClaim.visibility = View.GONE
                // Botón editar visible solo si no está entregado
                if (order.status != "delivered") {
                    btnEdit.visibility = View.VISIBLE
                    btnEdit.setOnClickListener { onEdit(order) }
                } else {
                    btnEdit.visibility = View.GONE
                }
            }

            // Items
            itemsContainer.removeAllViews()
            order.items.forEach { item ->
                val itemRow = createItemRow(item)
                itemsContainer.addView(itemRow)
            }

            // Total
            tvTotal.text = "$${"%.2f".format(order.total)}"
            tvTotal.setTextColor(Color.parseColor("#E8673A"))
        }

        private fun createItemRow(item: com.codex.foodify.data.model.OrderItemDto): View {
            val context = itemView.context
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.setMargins(0, 4, 0, 4)

            val row = LinearLayout(context)
            row.layoutParams = params
            row.orientation = LinearLayout.HORIZONTAL

            val typedValue = android.util.TypedValue()
            
            // Text color primary (colorOnSurface)
            context.theme.resolveAttribute(com.google.android.material.R.attr.colorOnSurface, typedValue, true)
            val primaryColor = typedValue.data
            
            // Text color secondary
            context.theme.resolveAttribute(android.R.attr.textColorSecondary, typedValue, true)
            val secondaryColor = typedValue.data

            // Cantidad y nombre del plato (izquierda)
            val itemText = TextView(context)
            itemText.layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            )
            itemText.text = "${item.quantity}x ${item.dishName}"
            itemText.textSize = 14f
            itemText.setTextColor(primaryColor)

            // Subtotal (derecha)
            val subtotalText = TextView(context)
            subtotalText.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            subtotalText.text = "$${"%.2f".format(item.subtotal)}"
            subtotalText.textSize = 14f
            subtotalText.setTextColor(secondaryColor)

            row.addView(itemText)
            row.addView(subtotalText)

            return row
        }

        private fun formatDate(dateString: String): String {
            return try {
                val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
                inputFormat.timeZone = TimeZone.getTimeZone("UTC")
                val date = inputFormat.parse(dateString)
                val outputFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
                date?.let { outputFormat.format(it) } ?: dateString
            } catch (e: Exception) {
                dateString
            }
        }
    }

    class OrderDiffCallback : DiffUtil.ItemCallback<OrderDto>() {
        override fun areItemsTheSame(oldItem: OrderDto, newItem: OrderDto): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: OrderDto, newItem: OrderDto): Boolean {
            return oldItem == newItem
        }
    }
}