// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dashboard/TopDishesAdapter.kt
package com.codex.foodify.ui.admin.dashboard

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.TopDish
import com.codex.foodify.databinding.ItemTopDishBinding

class TopDishesAdapter : ListAdapter<TopDish, TopDishesAdapter.VH>(DiffCb()) {

    inner class VH(val binding: ItemTopDishBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: TopDish) {
            binding.tvDishName.text  = item.name
            binding.tvDishCount.text = "${item.quantity} vendidos"
            try {
                binding.viewColor.setBackgroundColor(Color.parseColor(item.color ?: "#FF6B35"))
            } catch (_: Exception) {}
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemTopDishBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<TopDish>() {
        override fun areItemsTheSame(a: TopDish, b: TopDish) = a.name == b.name
        override fun areContentsTheSame(a: TopDish, b: TopDish) = a == b
    }
}
