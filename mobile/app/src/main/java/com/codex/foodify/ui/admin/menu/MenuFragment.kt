// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/MenuFragment.kt
package com.codex.foodify.ui.admin.menu

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.CategoriesUiState
import com.codex.foodify.data.model.CategoryOperationState
import com.codex.foodify.data.model.Category
import com.codex.foodify.data.model.Dish
import com.codex.foodify.data.model.Menu
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentMenuBinding
import androidx.navigation.fragment.findNavController
import com.codex.foodify.ui.admin.dishes.AddEditDishDialog
import com.codex.foodify.ui.admin.dishes.DishesAdapter
import com.codex.foodify.ui.admin.dishes.DishesViewModel
import com.codex.foodify.ui.admin.menu.categories.CategoriesAdapter
import com.codex.foodify.ui.admin.menu.categories.CategoryFormBottomSheet
import com.codex.foodify.ui.admin.menu.categories.CategoryViewModel
import com.google.android.material.chip.Chip
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MenuFragment : Fragment() {
    private var _binding: FragmentMenuBinding? = null
    private val binding get() = _binding!!

    private val viewModel: MenuViewModel by activityViewModels()
    private lateinit var menuAdapter: MenuAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMenuBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupListeners()
        observeViewModel()

        viewModel.loadMenus()
    }

    private fun setupRecyclerView() {
        menuAdapter = MenuAdapter(
            onMenuClick = { menu -> navigateToCategories(menu) },
            onStatusChange = { menu, isActive -> viewModel.updateMenuStatus(menu.id, isActive) },
            onEditClick = { menu -> showCreateMenuBottomSheet(menu) },
            onDeleteClick = { menu -> confirmDeleteMenu(menu) },
            onManageCategories = { menu -> navigateToCategories(menu) }
        )
        binding.rvDishes.apply { // Reusando el ID por ahora o cambiar en layout
            layoutManager = LinearLayoutManager(requireContext())
            adapter = menuAdapter
        }
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadMenus() }
        binding.fabAdd.setOnClickListener { showCreateMenuBottomSheet() }
        
        // Mostrar pestañas para gestión general
        binding.tabPlatillos.visibility = View.VISIBLE
        binding.tabCategorias.visibility = View.VISIBLE
        
        binding.tabCategorias.setOnClickListener {
            val bundle = Bundle().apply {
                putInt("menuId", -1)
                putString("menuName", "Global")
            }
            findNavController().navigate(R.id.action_menuFragment_to_categoriesFragment, bundle)
        }
        
        binding.cardSearch.visibility = View.GONE
        binding.layoutFilters.visibility = View.GONE
    }

    private fun showCreateMenuBottomSheet(menu: Menu? = null) {
        CreateMenuBottomSheet.newInstance(menu).show(childFragmentManager, "CreateMenu")
    }

    private fun observeViewModel() {
        viewModel.menus.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                menuAdapter.submitList(result.data)
                binding.layoutEmptyState.visibility = if (result.data.isEmpty()) View.VISIBLE else View.GONE
                binding.rvDishes.visibility = if (result.data.isEmpty()) View.GONE else View.VISIBLE
            }
        }

        viewModel.operationState.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                Toast.makeText(requireContext(), "Operación exitosa", Toast.LENGTH_SHORT).show()
                viewModel.clearOperationState()
            } else if (result is Result.Error) {
                Toast.makeText(requireContext(), result.message, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun navigateToCategories(menu: Menu) {
        val bundle = Bundle().apply {
            putInt("menuId", menu.id)
            putString("menuName", menu.name)
        }
        findNavController()
            .navigate(R.id.action_menuFragment_to_categoriesFragment, bundle)
    }

    private fun confirmDeleteMenu(menu: Menu) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Eliminar Menú")
            .setMessage("¿Estás seguro de que deseas eliminar '${menu.name}'? Solo se eliminará el acceso al menú; tus platillos y categorías permanecerán intactos.")
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Eliminar") { _, _ ->
                viewModel.deleteMenu(menu.id)
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}