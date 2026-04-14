// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/CategoriesFragment.kt
package com.codex.foodify.ui.admin.menu.categories

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.ItemTouchHelper
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.CategoriesUiState
import com.codex.foodify.data.model.Category
import com.codex.foodify.data.model.CategoryOperationState
import com.codex.foodify.databinding.FragmentCategoriesBinding
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class CategoriesFragment : Fragment() {

    private var _binding: FragmentCategoriesBinding? = null
    private val binding get() = _binding!!

    // menuId viene del fragmento padre (Gestión de Menú)
    private val menuId: Int by lazy {
        arguments?.getInt("menuId") ?: -1
    }
    private val menuName: String by lazy {
        arguments?.getString("menuName") ?: "Categorías"
    }

    private val viewModel: CategoryViewModel by viewModels()
    private val dishesViewModel: com.codex.foodify.ui.admin.dishes.DishesViewModel by activityViewModels()
    private lateinit var adapter: CategoriesAdapter
    private var itemTouchHelper: ItemTouchHelper? = null
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCategoriesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupToolbar()
        setupRecyclerView()
        setupSearch()
        setupFab()
        observeViewModel()
        
        if (menuId != -1) {
            viewModel.loadCategories(menuId)
        } else {
            viewModel.loadCategories(-1) // Cargar todas
        }
        dishesViewModel.loadDishes() // Cargar platillos para validación
    }
    private fun setupToolbar() {
        if (menuId == -1) {
            binding.textViewTitle.text = "Todas las Categorías"
        } else {
            binding.textViewTitle.text = "Categorías de $menuName"
        }
        binding.buttonBack.setOnClickListener {
            findNavController().navigateUp()
        }
    }

    private fun setupRecyclerView() {
        adapter = CategoriesAdapter(
            onEditClick = { category -> openEditBottomSheet(category) },
            onDeleteClick = { category -> openDeleteBottomSheet(category) },
            onAddDishesClick = { category -> showDishSelector(category) },
            onDragStart = { viewHolder -> itemTouchHelper?.startDrag(viewHolder) }
        )
        binding.recyclerViewCategories.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@CategoriesFragment.adapter
        }

        setupItemTouchHelper()
    }

    private fun setupItemTouchHelper() {
        val callback = object : ItemTouchHelper.SimpleCallback(
            ItemTouchHelper.UP or ItemTouchHelper.DOWN, 0
        ) {
            override fun onMove(
                recyclerView: RecyclerView,
                viewHolder: RecyclerView.ViewHolder,
                target: RecyclerView.ViewHolder
            ): Boolean {
                val fromPos = viewHolder.adapterPosition
                val toPos = target.adapterPosition
                if (fromPos != RecyclerView.NO_POSITION && toPos != RecyclerView.NO_POSITION) {
                    viewModel.onMove(fromPos, toPos)
                }
                return true
            }

            override fun onSwiped(viewHolder: RecyclerView.ViewHolder, direction: Int) {}
        }
        itemTouchHelper = ItemTouchHelper(callback)
        itemTouchHelper?.attachToRecyclerView(binding.recyclerViewCategories)
    }

    private fun showDishSelector(category: Category) {
        val sheet = com.codex.foodify.ui.admin.menu.categories.SelectDishesBottomSheet.newInstance()
        sheet.onDishesSelected = { ids ->
            dishesViewModel.batchUpdateDishCategory(ids, category.id)
        }
        sheet.show(childFragmentManager, "select_dishes")
    }

    private fun setupSearch() {
        binding.editTextSearch.addTextChangedListener { editable ->
            viewModel.filterCategories(editable.toString())
        }
    }

    private fun setupFab() {
        binding.fabAddCategory.setOnClickListener {
            openCreateBottomSheet()
        }
        binding.buttonAddFirstCategory.setOnClickListener {
            openCreateBottomSheet()
        }
    }

    private fun observeViewModel() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    viewModel.uiState.collect { state ->
                        when (state) {
                            is CategoriesUiState.Loading -> showLoading()
                            is CategoriesUiState.Success -> showCategories(state.categories)
                            is CategoriesUiState.Empty   -> showEmptyState()
                            is CategoriesUiState.Error   -> showError(state.message)
                        }
                    }
                }

                launch {
                    viewModel.operationState.collect { state ->
                        when (state) {
                            is CategoryOperationState.Loading -> showOperationLoading()
                            is CategoryOperationState.Success -> {
                                hideOperationLoading()
                                viewModel.resetOperationState()
                                viewModel.loadCategories(menuId)
                            }
                            is CategoryOperationState.Error -> {
                                hideOperationLoading()
                                showSnackbar(state.message)
                                viewModel.resetOperationState()
                            }
                            is CategoryOperationState.Idle -> hideOperationLoading()
                        }
                    }
                }
            }
        }
    }

    private fun showLoading() {
        binding.progressBar.visibility = View.VISIBLE
        binding.recyclerViewCategories.visibility = View.GONE
        binding.layoutEmptyState.visibility = View.GONE
    }

    private fun showCategories(categories: List<Category>) {
        binding.progressBar.visibility = View.GONE
        binding.recyclerViewCategories.visibility = View.VISIBLE
        binding.layoutEmptyState.visibility = View.GONE
        adapter.submitList(categories)
    }

    private fun showEmptyState() {
        binding.progressBar.visibility = View.GONE
        binding.recyclerViewCategories.visibility = View.GONE
        binding.layoutEmptyState.visibility = View.VISIBLE
    }

    private fun showError(message: String) {
        binding.progressBar.visibility = View.GONE
        showSnackbar(message)
    }

    private fun showOperationLoading() {
        binding.progressBarOperation.visibility = View.VISIBLE
    }

    private fun hideOperationLoading() {
        binding.progressBarOperation.visibility = View.GONE
    }

    private fun showSnackbar(message: String) {
        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
    }

    private fun openCreateBottomSheet() {
        if (menuId == -1) {
            val menus = viewModel.availableMenus.value
            if (menus.isEmpty()) {
                showSnackbar("No hay menús disponibles para crear categorías.")
                return
            }
            
            val menuNames = menus.map { it.name }.toTypedArray()
            com.google.android.material.dialog.MaterialAlertDialogBuilder(requireContext())
                .setTitle("Seleccionar Menú")
                .setItems(menuNames) { _, which ->
                    val selectedMenu = menus[which]
                    showCategoryFormForMenu(selectedMenu.id)
                }
                .setNegativeButton("Cancelar", null)
                .show()
        } else {
            showCategoryFormForMenu(menuId)
        }
    }

    private fun showCategoryFormForMenu(id: Int) {
        val sheet = CategoryFormBottomSheet.newInstanceCreate(
            nextSortOrder = viewModel.getNextSortOrder()
        )
        sheet.onCategoryCreated = { request ->
            viewModel.createCategory(request, targetMenuId = id)
        }
        sheet.show(childFragmentManager, "create_category")
    }

    private fun openEditBottomSheet(category: Category) {
        val sheet = CategoryFormBottomSheet.newInstanceEdit(category)
        sheet.onCategoryUpdated = { request ->
            viewModel.updateCategory(category.id, request)
        }
        sheet.show(childFragmentManager, "edit_category")
    }

    private fun openDeleteBottomSheet(category: Category) {
        // Encontrar platillos afectados
        val dishes = (dishesViewModel.dishes.value as? com.codex.foodify.data.repository.Result.Success)?.data ?: emptyList()
        val affectedDishesNames = dishes.filter { it.categoryId == category.id }.map { it.displayName }

        val sheet = DeleteCategoryBottomSheet.newInstance(category.name, affectedDishesNames)
        sheet.onDeleteConfirmed = {
            viewModel.deleteCategory(category.id)
        }
        sheet.show(childFragmentManager, "delete_category")
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
