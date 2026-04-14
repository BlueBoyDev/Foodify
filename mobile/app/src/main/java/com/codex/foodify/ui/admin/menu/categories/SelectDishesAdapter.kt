// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/SelectDishesAdapter.kt
package com.codex.foodify.ui.admin.menu.categories

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.codex.foodify.R
import com.codex.foodify.data.model.Dish
import com.codex.foodify.databinding.ItemDishSelectableBinding

class SelectDishesAdapter(
    private val onSelectionChanged: (Set<Int>) -> Unit
) : ListAdapter<Dish, SelectDishesAdapter.DishViewHolder>(DishDiffCallback()) {

    private val selectedIds = mutableSetOf<Int>()

    fun getSelectedIds(): List<Int> = selectedIds.toList()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DishViewHolder {
        val binding = ItemDishSelectableBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return DishViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DishViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class DishViewHolder(private val binding: ItemDishSelectableBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(dish: Dish) {
            binding.tvDishName.text = dish.displayName
            binding.tvCategory.text = dish.category?.name ?: "Sin categoría"
            
            // Cargar imagen
            Glide.with(binding.ivDish.context)
                .load(dish.displayImage)
                .placeholder(R.drawable.ic_dish_placeholder)
                .error(R.drawable.ic_dish_placeholder)
                .centerCrop()
                .into(binding.ivDish)

            // Estado del CheckBox
            binding.checkBox.setOnCheckedChangeListener(null)
            binding.checkBox.isChecked = selectedIds.contains(dish.id)

            binding.checkBox.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) selectedIds.add(dish.id)
                else selectedIds.remove(dish.id)
                onSelectionChanged(selectedIds)
            }

            binding.root.setOnClickListener {
                binding.checkBox.isChecked = !binding.checkBox.isChecked
            }
        }
    }

    class DishDiffCallback : DiffUtil.ItemCallback<Dish>() {
        override fun areItemsTheSame(oldItem: Dish, newItem: Dish): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Dish, newItem: Dish): Boolean =
            oldItem == newItem
    }
}
