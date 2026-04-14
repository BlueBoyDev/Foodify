// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/MenuAdapter.kt
package com.codex.foodify.ui.admin.menu

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.PopupMenu
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.Menu
import com.codex.foodify.databinding.ItemMenuBinding

class MenuAdapter(
    private val onMenuClick: (Menu) -> Unit,
    private val onStatusChange: (Menu, Boolean) -> Unit,
    private val onEditClick: (Menu) -> Unit,
    private val onDeleteClick: (Menu) -> Unit,
    private val onManageCategories: (Menu) -> Unit
) : ListAdapter<Menu, MenuAdapter.MenuViewHolder>(MenuDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MenuViewHolder {
        val binding = ItemMenuBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return MenuViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MenuViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class MenuViewHolder(private val binding: ItemMenuBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(menu: Menu) {
            binding.tvMenuName.text = menu.name
            
            // Horario
            binding.tvMenuSchedule.text = menu.description ?: "Sin horario definido"
            
            // Switch de estado
            binding.switchActive.setOnCheckedChangeListener(null)
            binding.switchActive.isChecked = menu.isActive
            binding.switchActive.setOnCheckedChangeListener { _, isChecked ->
                onStatusChange(menu, isChecked)
            }
            
            // Conteos (Simulados o desde el objeto si el backend los trae)
            val catCount = menu.categories?.size ?: 0
            binding.tvCategoriesCount.text = "$catCount categorías"
            binding.tvDishesCount.text = "Gestionar contenido" // El backend no siempre trae el conteo de platos aquí
            
            // Click en la card
            binding.root.setOnClickListener { onMenuClick(menu) }
            
            // Botones de acción directos
            binding.buttonEditMenu.setOnClickListener { onEditClick(menu) }
            binding.buttonDeleteMenu.setOnClickListener { onDeleteClick(menu) }
        }
    }

    class MenuDiffCallback : DiffUtil.ItemCallback<Menu>() {
        override fun areItemsTheSame(oldItem: Menu, newItem: Menu): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Menu, newItem: Menu): Boolean = oldItem == newItem
    }
}
