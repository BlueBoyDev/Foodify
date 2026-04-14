// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dishes/CategorySpinnerAdapter.kt
package com.codex.foodify.ui.admin.dishes

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.BaseAdapter
import android.widget.Filter
import android.widget.Filterable
import android.widget.TextView
import com.codex.foodify.R
import com.codex.foodify.data.model.DishCategory
import com.codex.foodify.data.model.Menu

class CategorySpinnerAdapter(
    private val context: Context,
    private val menus: List<Menu>,
    private val allCategories: List<DishCategory>
) : BaseAdapter(), Filterable {

    private val items = mutableListOf<Item>()
    private var filteredItems = mutableListOf<Item>()

    sealed class Item {
        data class Header(val name: String) : Item()
        data class Category(val category: DishCategory) : Item()
    }

    init {
        rebuildItems()
    }

    private fun rebuildItems() {
        items.clear()
        menus.forEach { menu ->
            val menuCategories = allCategories.filter { it.menuId == menu.id }
            if (menuCategories.isNotEmpty()) {
                items.add(Item.Header(menu.name))
                menuCategories.forEach { items.add(Item.Category(it)) }
            }
        }
        filteredItems = items.toMutableList()
    }

    override fun getCount(): Int = filteredItems.size
    override fun getItem(position: Int): Any = filteredItems[position]
    override fun getItemId(position: Int): Long = position.toLong()

    override fun getViewTypeCount(): Int = 2
    override fun getItemViewType(position: Int): Int = when (filteredItems[position]) {
        is Item.Header -> 0
        is Item.Category -> 1
    }

    override fun getView(position: Int, convertView: View?, parent: ViewGroup?): View {
        val item = filteredItems[position]
        return when (item) {
            is Item.Header -> {
                val view = convertView ?: LayoutInflater.from(context).inflate(
                    R.layout.layout_sectioned_spinner_header, parent, false
                )
                view.findViewById<TextView>(R.id.tv_header_title).text = item.name
                view.setOnClickListener(null) // Headers are not clickable
                view
            }
            is Item.Category -> {
                val view = convertView ?: LayoutInflater.from(context).inflate(
                    R.layout.layout_sectioned_spinner_item, parent, false
                )
                view.findViewById<TextView>(R.id.tv_item_name).text = item.category.name
                view
            }
        }
    }

    override fun isEnabled(position: Int): Boolean {
        return filteredItems[position] is Item.Category
    }

    override fun getFilter(): Filter {
        return object : Filter() {
            override fun performFiltering(constraint: CharSequence?): FilterResults {
                val results = FilterResults()
                if (constraint == null || constraint.isEmpty()) {
                    results.values = items
                    results.count = items.size
                } else {
                    val query = constraint.toString().lowercase()
                    val filtered = items.filter {
                        when (it) {
                            is Item.Header -> false // Don't match headers alone
                            is Item.Category -> it.category.name.lowercase().contains(query)
                        }
                    }
                    results.values = filtered
                    results.count = filtered.size
                }
                return results
            }

            override fun publishResults(constraint: CharSequence?, results: FilterResults?) {
                filteredItems = (results?.values as? List<Item>)?.toMutableList() ?: mutableListOf()
                notifyDataSetChanged()
            }

            override fun convertResultToString(resultValue: Any?): CharSequence {
                return when (resultValue) {
                    is Item.Category -> resultValue.category.name
                    else -> ""
                }
            }
        }
    }
}
