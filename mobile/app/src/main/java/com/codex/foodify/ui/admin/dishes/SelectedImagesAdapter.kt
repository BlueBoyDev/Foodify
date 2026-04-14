package com.codex.foodify.ui.admin.dishes

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.codex.foodify.databinding.ItemDishImageSelectedBinding

class SelectedImagesAdapter(
    private val onRemove: (Int) -> Unit
) : RecyclerView.Adapter<SelectedImagesAdapter.VH>() {

    private var images = mutableListOf<String>()

    fun submitList(newImages: List<String>) {
        images = newImages.toMutableList()
        notifyDataSetChanged()
    }

    inner class VH(val b: ItemDishImageSelectedBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(url: String, position: Int) {
            val isS3 = url.startsWith("http") || url.contains("amazonaws.com")
            val isLocalFile = url.startsWith("/")
            val isValid = isS3 || isLocalFile
            
            Glide.with(b.ivDishImage)
                .load(if (isValid) url else null)
                .placeholder(com.codex.foodify.R.drawable.ic_dish_placeholder)
                .error(com.codex.foodify.R.drawable.ic_dish_placeholder)
                .centerCrop()
                .into(b.ivDishImage)
            
            b.ivDishImage.alpha = if (isValid) 1.0f else 0.4f
            
            b.btnRemoveImage.setOnClickListener {
                onRemove(position)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val b = ItemDishImageSelectedBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(b)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        holder.bind(images[position], position)
    }

    override fun getItemCount() = images.size
}
