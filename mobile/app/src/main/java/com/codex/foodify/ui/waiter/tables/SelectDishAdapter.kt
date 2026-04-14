// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/tables/SelectDishAdapter.kt
// Adapter para seleccionar platillos al crear una orden — botones +/-
package com.codex.foodify.ui.waiter.tables

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.codex.foodify.R
import com.codex.foodify.data.model.Dish
import com.codex.foodify.databinding.ItemSelectDishBinding

class SelectDishAdapter(
    private val onQtyChange: (Dish, Int) -> Unit,
) : ListAdapter<Dish, SelectDishAdapter.VH>(DiffCb()) {

    private val quantities = mutableMapOf<Int, Int>()

    fun updateCart(cart: Map<Int, Pair<Dish, Int>>) {
        quantities.clear()
        cart.forEach { (id, pair) -> quantities[id] = pair.second }
        notifyDataSetChanged()
    }

    inner class VH(val b: ItemSelectDishBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(dish: Dish) {
            b.tvDishName.text  = dish.displayName
            b.tvDishPrice.text = "$${ String.format("%.0f", dish.displayPrice) }"
            b.tvQty.text       = (quantities[dish.id] ?: 0).toString()

            // Imagen con Glide - Sanetización de rutas
            val imageUrl = dish.displayImage
            val isS3 = imageUrl?.startsWith("http") == true || imageUrl?.contains("amazonaws.com") == true

            Glide.with(b.ivDish.context)
                .load(if (isS3) imageUrl else null)
                .placeholder(R.drawable.ic_fork_spoon)
                .error(R.drawable.ic_fork_spoon)
                .into(b.ivDish)
            
            b.ivDish.alpha = if (isS3) 1.0f else 0.4f

            b.btnMinus.setOnClickListener {
                val current = quantities[dish.id] ?: 0
                if (current > 0) {
                    quantities[dish.id] = current - 1
                    b.tvQty.text = (current - 1).toString()
                    onQtyChange(dish, current - 1)
                }
            }
            b.btnPlus.setOnClickListener {
                val current = quantities[dish.id] ?: 0
                quantities[dish.id] = current + 1
                b.tvQty.text = (current + 1).toString()
                onQtyChange(dish, current + 1)
            }
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemSelectDishBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<Dish>() {
        override fun areItemsTheSame(a: Dish, b: Dish) = a.id == b.id
        override fun areContentsTheSame(a: Dish, b: Dish) = a == b
    }
}
