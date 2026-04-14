package com.codex.foodify.ui.admin.dishes

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.RecipeIngredientDto
import com.codex.foodify.databinding.ItemIngredientFormBinding

/**
 * Adapter especializado para gestionar la lista de ingredientes dentro del formulario de platillo.
 * Utiliza ListAdapter para animaciones eficientes y submitList para sincronización de datos.
 */
class IngredientsFormAdapter(
    private val onEdit: (Int, RecipeIngredientDto) -> Unit,
    private val onDelete: (RecipeIngredientDto) -> Unit
) : ListAdapter<RecipeIngredientDto, IngredientsFormAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemIngredientFormBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemIngredientFormBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(ingredient: RecipeIngredientDto) {
            binding.tvIngredientName.text = ingredient.name
            binding.tvQuantityUnit.text = "${ingredient.quantity} ${ingredient.unit}"
            
            binding.tvOptional.visibility = if (ingredient.isOptional) View.VISIBLE else View.GONE

            binding.btnEdit.setOnClickListener { 
                onEdit(adapterPosition, ingredient)
            }
            binding.btnDelete.setOnClickListener { 
                onDelete(ingredient) 
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<RecipeIngredientDto>() {
        override fun areItemsTheSame(a: RecipeIngredientDto, b: RecipeIngredientDto) = 
            a.itemId == b.itemId && a.name == b.name

        override fun areContentsTheSame(a: RecipeIngredientDto, b: RecipeIngredientDto) = 
            a == b
    }
}
