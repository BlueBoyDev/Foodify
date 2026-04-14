// RUTA: app/src/main/java/com/codex/foodify/ui/admin/inventory/InventoryAdapter.kt
// Card de lote con borde de color según estado:
//   Verde  = available (Disponible)
//   Amarillo = low (Próximo a caducar)
//   Rojo   = expired (Caducado)
//   Gris   = depleted (Sin stock)
package com.codex.foodify.ui.admin.inventory

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.IngredientGroup
import com.codex.foodify.data.model.InventoryLot
import com.codex.foodify.databinding.ItemInventoryLotBinding
import com.codex.foodify.databinding.ItemLotDetailRowBinding

class InventoryAdapter(
    private val onAdjust: (IngredientGroup) -> Unit,
    private val onEditLot: (InventoryLot) -> Unit,
    private val onDeleteLot: (InventoryLot) -> Unit,
) : ListAdapter<IngredientGroup, InventoryAdapter.VH>(DiffCb()) {

    inner class VH(val b: ItemInventoryLotBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(group: IngredientGroup) {
            b.tvItemName.text = group.itemName
            b.tvCategory.text = group.category ?: "Sin categoría"
            b.tvCategory.visibility = if (group.category != null) android.view.View.VISIBLE else android.view.View.GONE
            b.tvTotalRemaining.text = "${group.totalRemaining} ${group.unit}"
            b.tvUnit.text = group.unit
            b.tvStatus.text = group.lots.firstOrNull()?.displayStatus ?: "Sin stock"

            // Color de borde y badge según estado del grupo
            val strokeColor = when (group.status) {
                "available" -> R.color.status_available
                "low"       -> R.color.status_reserved
                "critical"  -> R.color.urgent_orange
                "expired"   -> R.color.status_occupied
                "depleted"  -> R.color.text_low_light
                else        -> R.color.status_available
            }
            val ctx = b.root.context
            b.tvStatus.setBackgroundTintList(ctx.getColorStateList(strokeColor))
            b.cardStroke.strokeColor = ctx.getColor(strokeColor)

            // Limpiar y llenar el contenedor de lotes
            b.containerLots.removeAllViews()
            group.lots.forEach { lot ->
                val lotBinding = ItemLotDetailRowBinding.inflate(LayoutInflater.from(ctx), b.containerLots, false)
                lotBinding.tvLotNumber.text = lot.lotNumber ?: "Lote #${lot.id}"
                lotBinding.tvExpiryDate.text = "Caduca: ${lot.expiryDate ?: "Sin fecha"}"
                lotBinding.tvLotQuantity.text = "${lot.remaining} ${group.unit}"
                
                // Color por lote individual usando estado calculado
                val lotColor = when (lot.calculatedStatus) {
                    "available" -> R.color.status_available
                    "low"       -> R.color.status_reserved
                    "critical"  -> R.color.urgent_orange
                    "expired"   -> R.color.status_occupied
                    "depleted"  -> R.color.text_low_light
                    else        -> R.color.status_available
                }
                lotBinding.viewStatusIndicator.backgroundTintList = ctx.getColorStateList(lotColor)
                lotBinding.tvLotQuantity.setTextColor(ctx.getColor(lotColor))

                lotBinding.btnEditLot.setOnClickListener { onEditLot(lot) }
                lotBinding.btnDeleteLot.setOnClickListener { onDeleteLot(lot) }
                
                b.containerLots.addView(lotBinding.root)
            }

            b.btnAdjustGroup.setOnClickListener { onAdjust(group) }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemInventoryLotBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<IngredientGroup>() {
        override fun areItemsTheSame(a: IngredientGroup, b: IngredientGroup) = a.itemName == b.itemName
        override fun areContentsTheSame(a: IngredientGroup, b: IngredientGroup) = a == b
    }
}
