// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/CategoriesAdapter.kt
package com.codex.foodify.ui.admin.menu.categories

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.Category
import com.codex.foodify.databinding.ItemCategoryBinding

class CategoriesAdapter(
    private val onEditClick: (Category) -> Unit,
    private val onDeleteClick: (Category) -> Unit,
    private val onAddDishesClick: (Category) -> Unit,
    private val onDragStart: (RecyclerView.ViewHolder) -> Unit
) : ListAdapter<Category, CategoriesAdapter.CategoryViewHolder>(CategoryDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val binding = ItemCategoryBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return CategoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CategoryViewHolder(
        private val binding: ItemCategoryBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(category: Category) {
            binding.textViewName.text = category.name
            
            // Descripción — ocultar si es nula o vacía
            if (category.description.isNullOrBlank()) {
                binding.textViewDescription.visibility = View.GONE
            } else {
                binding.textViewDescription.visibility = View.VISIBLE
                binding.textViewDescription.text = category.description
            }

            // Horario — mostrar solo si existe schedule
            if (category.schedule != null) {
                binding.layoutSchedule.visibility = View.VISIBLE
                binding.textViewSchedule.text =
                    "Disponible: ${category.schedule.start} - ${category.schedule.end}"
            } else {
                binding.layoutSchedule.visibility = View.GONE
            }

            // Clicks
            binding.buttonEdit.setOnClickListener { onEditClick(category) }
            binding.root.setOnClickListener { onEditClick(category) }

            binding.buttonDelete.setOnClickListener {
                onDeleteClick(category)
            }

            binding.buttonAddDishes.setOnClickListener {
                onAddDishesClick(category)
            }

            // Handle de arrastre
            binding.ivDragHandle.setOnTouchListener { _, event ->
                if (event.actionMasked == android.view.MotionEvent.ACTION_DOWN) {
                    onDragStart(this)
                }
                false
            }
        }
    }

    class CategoryDiffCallback : DiffUtil.ItemCallback<Category>() {
        override fun areItemsTheSame(oldItem: Category, newItem: Category): Boolean =
            oldItem.id == newItem.id

        override fun areContentsTheSame(oldItem: Category, newItem: Category): Boolean =
            oldItem == newItem
    }
}
