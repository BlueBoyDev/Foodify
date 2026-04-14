// RUTA: app/src/main/java/com/codex/foodify/ui/admin/dishes/DishesFragment.kt
// Lista de Platillos — buscador + filtros por categoría + FAB agregar
package com.codex.foodify.ui.admin.dishes

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.Menu
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentDishesBinding
import com.google.android.material.chip.Chip
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class DishesFragment : Fragment() {

    private var _binding: FragmentDishesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: DishesViewModel by activityViewModels()
    private lateinit var adapter: DishesAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentDishesBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupFilters()
        setupMenuFilter()
        setupSearch()
        observeViewModel()

        viewModel.loadMenus()
        viewModel.loadDishes()
        
        binding.fabAddDish.setOnClickListener {
            AddEditDishDialog.newInstance(null).show(childFragmentManager, "add_dish")
        }
        binding.swipeRefresh.setOnRefreshListener { 
            viewModel.loadMenus()
            viewModel.loadDishes() 
        }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun setupRecyclerView() {
        adapter = DishesAdapter(
            onToggleAvailability = { dish -> viewModel.toggleAvailability(dish) },
            onEdit  = { dish -> AddEditDishDialog.newInstance(dish.id).show(childFragmentManager, "edit_dish") },
            onDelete = { dish ->
                MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Eliminar Platillo")
                    .setMessage("¿Estás seguro de que deseas eliminar '${dish.displayName}'? Esta acción no se puede deshacer.")
                    .setNegativeButton("Cancelar", null)
                    .setPositiveButton("Eliminar") { _, _ ->
                        viewModel.deleteDish(dish.id)
                    }
                    .show()
            }
        )
        binding.rvDishes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDishes.adapter = adapter
    }

    private fun setupMenuFilter() {
        viewModel.menus.observe(viewLifecycleOwner) { menus: List<Menu> ->
            val menuNames = listOf("Todos los Menús") + menus.map { menu -> menu.name }
            val adapter = android.widget.ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, menuNames)
            binding.spinnerMenuFilter.setAdapter(adapter)

            // Actualizar el mapa de nombres en el DishesAdapter
            val menuMap = menus.associate { menu -> menu.id to menu.name }
            (binding.rvDishes.adapter as? DishesAdapter)?.updateMenuMap(menuMap)

            binding.spinnerMenuFilter.setOnItemClickListener { _, _, position, _ ->
                if (position == 0) {
                    viewModel.filterByMenu(null)
                    viewModel.loadCategories() // Load all
                } else {
                    val selectedMenu = menus[position - 1]
                    viewModel.filterByMenu(selectedMenu.id)
                    viewModel.loadCategories() 
                }
            }
        }
    }

    private fun setupFilters() {
        viewModel.categories.observe(viewLifecycleOwner) { categories ->
            binding.chipGroupFilters.removeAllViews()
            addFilterChip("Todos", true)
            categories.forEach { cat -> addFilterChip(cat.name, false) }
        }
    }

    private fun addFilterChip(label: String, isInitial: Boolean) {
        val chip = Chip(requireContext()).apply {
            text = label
            isCheckable = true
            isChecked = isInitial
            chipCornerRadius = 50f
            setChipBackgroundColorResource(R.color.chip_selector)
            setTextColor(requireContext().getColorStateList(R.color.chip_text_selector))
        }

        chip.setOnCheckedChangeListener { _, checked ->
            if (checked) {
                viewModel.filterByCategory(label)
                // Deseleccionar otros chips
                for (i in 0 until binding.chipGroupFilters.childCount) {
                    val c = binding.chipGroupFilters.getChildAt(i) as? Chip
                    if (c != chip) c?.isChecked = false
                }
            }
        }
        binding.chipGroupFilters.addView(chip)
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener { text ->
            val query = text?.toString()?.trim()
            if (query.isNullOrEmpty()) viewModel.loadDishes()
            else viewModel.loadDishes(search = query)
        }
    }

    private fun observeViewModel() {
        viewModel.dishes.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> {
                    binding.swipeRefresh.isRefreshing = true
                    binding.tvEmptyState.visibility = View.GONE
                }
                is Result.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data)
                    binding.tvEmptyState.visibility =
                        if (result.data.isEmpty()) View.VISIBLE else View.GONE
                }
                is Result.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    binding.tvEmptyState.text = result.message
                    binding.tvEmptyState.visibility = View.VISIBLE
                }
                else -> {
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                // Dialog se cierra automáticamente al observar success
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
