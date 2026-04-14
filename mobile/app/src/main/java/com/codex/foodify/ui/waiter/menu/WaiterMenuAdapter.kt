package com.codex.foodify.ui.waiter.menu

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.Dish
import com.codex.foodify.databinding.ItemDishCardBinding
import com.codex.foodify.databinding.ItemDishListBinding
import com.bumptech.glide.Glide
import java.text.NumberFormat
import java.util.Locale

class WaiterMenuAdapter(private val onDishClick: (Dish) -> Unit) :
    ListAdapter<Dish, RecyclerView.ViewHolder>(DishDiffCallback()) {

    var isGridView: Boolean = true
        set(value) {
            field = value
            notifyDataSetChanged()
        }

    private val currencyFmt = NumberFormat.getCurrencyInstance(Locale("es", "MX"))

    override fun getItemViewType(position: Int): Int {
        return if (isGridView) VIEW_TYPE_CARD else VIEW_TYPE_LIST
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == VIEW_TYPE_CARD) {
            val binding = ItemDishCardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            CardViewHolder(binding)
        } else {
            val binding = ItemDishListBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            ListViewHolder(binding)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val dish = getItem(position)
        if (holder is CardViewHolder) holder.bind(dish)
        else if (holder is ListViewHolder) holder.bind(dish)
    }

    inner class CardViewHolder(private val binding: ItemDishCardBinding) :
        RecyclerView.ViewHolder(binding.root) {
        fun bind(dish: Dish) {
            binding.tvDishName.text = dish.displayName
            binding.tvDishPrice.text = currencyFmt.format(dish.displayPrice)
            binding.tvDishCategory.text = dish.category?.name ?: ""
            
            // Imagen con Glide - Sanetización de rutas
            val imageUrl = dish.displayImage
            val isS3 = imageUrl?.startsWith("http") == true || imageUrl?.contains("amazonaws.com") == true
            
            Glide.with(binding.ivDish.context)
                .load(if (isS3) imageUrl else null)
                .placeholder(R.drawable.ic_fork_spoon)
                .error(R.drawable.ic_fork_spoon)
                .into(binding.ivDish)
            
            binding.ivDish.alpha = if (isS3) 1.0f else 0.4f

            binding.root.setOnClickListener { onDishClick(dish) }
        }
    }

    inner class ListViewHolder(private val binding: ItemDishListBinding) :
        RecyclerView.ViewHolder(binding.root) {
        fun bind(dish: Dish) {
            binding.tvDishName.text = dish.displayName
            binding.tvDishPrice.text = currencyFmt.format(dish.displayPrice)
            binding.tvDishDescription.text = dish.description
            
            // Imagen con Glide - Sanetización de rutas
            val imageUrl = dish.displayImage
            val isS3 = imageUrl?.startsWith("http") == true || imageUrl?.contains("amazonaws.com") == true

            Glide.with(binding.ivDish.context)
                .load(if (isS3) imageUrl else null)
                .placeholder(R.drawable.ic_fork_spoon)
                .error(R.drawable.ic_fork_spoon)
                .into(binding.ivDish)
            
            binding.ivDish.alpha = if (isS3) 1.0f else 0.4f

            binding.root.setOnClickListener { onDishClick(dish) }
        }
    }

    class DishDiffCallback : DiffUtil.ItemCallback<Dish>() {
        override fun areItemsTheSame(oldItem: Dish, newItem: Dish): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Dish, newItem: Dish): Boolean = oldItem == newItem
    }

    companion object {
        private const val VIEW_TYPE_CARD = 1
        private const val VIEW_TYPE_LIST = 2
    }
}
