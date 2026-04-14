// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dishes/DishesAdapter.kt
package com.codex.foodify.ui.admin.dishes

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.codex.foodify.R
import com.codex.foodify.data.model.Dish
import com.codex.foodify.databinding.ItemDishBinding

class DishesAdapter(
    private val onToggleAvailability: (Dish) -> Unit,
    private val onEdit: (Dish) -> Unit,
    private val onDelete: (Dish) -> Unit,
    private val onUnlink: ((Dish) -> Unit)? = null,
    private val showEdit: Boolean = true,
    private var menuMap: Map<Int, String> = emptyMap()
) : ListAdapter<Dish, DishesAdapter.VH>(DiffCb()) {

    fun updateMenuMap(newMap: Map<Int, String>) {
        menuMap = newMap
        notifyDataSetChanged()
    }

    inner class VH(val b: ItemDishBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(dish: Dish) {
            b.tvDishName.text        = dish.displayName
            b.tvDishPrice.text       = String.format("%.0f", dish.displayPrice)
            b.tvDishTime.text        = "${dish.displayTime} min"
            b.tvDishDescription.text = dish.description ?: ""
            
            // Categoría y Menú
            val catName = dish.category?.name ?: "Sin categoría"
            val menuName = menuMap[dish.category?.menuId] ?: "Menú"
            b.tvDishCategory.text = "🥩 $catName · $menuName"
            
            // Imagen con Glide - Sanetización de rutas
            val imageUrl = dish.displayImage
            if (!imageUrl.isNullOrEmpty()) {
                val isS3 = imageUrl.startsWith("http") || imageUrl.contains("amazonaws.com")
                
                Glide.with(b.ivDishImage)
                    .load(if (isS3) imageUrl else null)
                    .placeholder(R.drawable.ic_dish_placeholder)
                    .error(R.drawable.ic_dish_placeholder)
                    .centerCrop()
                    .into(b.ivDishImage)
                
                b.ivDishImage.alpha = if (isS3) 1.0f else 0.4f
            } else {
                b.ivDishImage.setImageResource(R.drawable.ic_dish_placeholder)
                b.ivDishImage.alpha = 1.0f
            }

            // Toggle disponibilidad
            b.switchAvailable.setOnCheckedChangeListener(null)
            b.switchAvailable.isChecked = dish.displayAvailable
            b.switchAvailable.setOnCheckedChangeListener { _, _ ->
                onToggleAvailability(dish)
            }

            // Editar
            b.btnEditDish.visibility = if (showEdit) android.view.View.VISIBLE else android.view.View.GONE
            b.btnEditDish.setOnClickListener { onEdit(dish) }
            
            // Eliminar - Punto 4
            b.btnDeleteDish.setOnClickListener { onDelete(dish) }

            // Quitar del menú (Unlink)
            if (onUnlink != null && dish.categoryId != null) {
                b.btnUnlinkDish.visibility = android.view.View.VISIBLE
                b.btnUnlinkDish.setOnClickListener { onUnlink.invoke(dish) }
            } else {
                b.btnUnlinkDish.visibility = android.view.View.GONE
            }
            
            // Toda la card abre edición
            if (showEdit) {
                b.root.setOnClickListener { onEdit(dish) }
            } else {
                b.root.setOnClickListener(null)
            }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemDishBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<Dish>() {
        override fun areItemsTheSame(a: Dish, b: Dish) = a.id == b.id
        override fun areContentsTheSame(a: Dish, b: Dish) = a == b
    }
}
