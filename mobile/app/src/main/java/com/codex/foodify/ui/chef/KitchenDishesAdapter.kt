package com.codex.foodify.ui.chef

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.codex.foodify.R
import com.codex.foodify.data.model.DishWithRecipeDto
import com.codex.foodify.databinding.ItemKitchenDishBinding

class KitchenDishesAdapter(
    private val onRecipeClick: (DishWithRecipeDto) -> Unit
) : ListAdapter<DishWithRecipeDto, KitchenDishesAdapter.DishViewHolder>(DishDiffCallback()) {

    private var fullList: List<DishWithRecipeDto> = emptyList()

    override fun submitList(list: List<DishWithRecipeDto>?) {
        fullList = list ?: emptyList()
        super.submitList(list)
    }

    private var currentQuery: String = ""
    private var currentCategory: String? = null

    fun filter(query: String, category: String? = null) {
        currentQuery = query
        if (category != null) {
            currentCategory = if (category == "Todos") null else category
        }
        
        val filteredList = fullList.filter { dish ->
            val matchesQuery = dish.name.contains(currentQuery, ignoreCase = true) || 
                               dish.categoryName?.contains(currentQuery, ignoreCase = true) == true
            
            val matchesCategory = currentCategory == null || dish.categoryName == currentCategory
            
            matchesQuery && matchesCategory
        }
        super.submitList(filteredList)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DishViewHolder {
        val binding = ItemKitchenDishBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return DishViewHolder(binding)
    }

    override fun onBindViewHolder(holder: DishViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class DishViewHolder(private val binding: ItemKitchenDishBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(dish: DishWithRecipeDto) {
            binding.tvDishName.text = dish.name
            binding.tvCategory.text = dish.categoryName ?: "General"
            
            val imageUrl = dish.images?.firstOrNull()
            binding.ivDish.visibility = android.view.View.VISIBLE
            
            // Imagen con Glide - Sanetización de rutas
            if (!imageUrl.isNullOrEmpty()) {
                val isS3 = imageUrl.startsWith("http") || imageUrl.contains("amazonaws.com")
                
                Glide.with(binding.ivDish)
                    .load(if (isS3) imageUrl else null)
                    .placeholder(R.drawable.ic_dish_placeholder)
                    .error(R.drawable.ic_dish_placeholder)
                    .centerCrop()
                    .into(binding.ivDish)
                
                binding.ivDish.alpha = if (isS3) 1.0f else 0.4f
            } else {
                binding.ivDish.setImageResource(R.drawable.ic_dish_placeholder)
                binding.ivDish.alpha = 1.0f
            }

            binding.btnRecipe.setOnClickListener { onRecipeClick(dish) }
        }
    }

    class DishDiffCallback : DiffUtil.ItemCallback<DishWithRecipeDto>() {
        override fun areItemsTheSame(oldItem: DishWithRecipeDto, newItem: DishWithRecipeDto) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: DishWithRecipeDto, newItem: DishWithRecipeDto) = oldItem == newItem
    }
}
