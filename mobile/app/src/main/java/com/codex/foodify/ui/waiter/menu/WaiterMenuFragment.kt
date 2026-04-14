package com.codex.foodify.ui.waiter.menu

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.Dish
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentWaiterMenuBinding
import com.codex.foodify.ui.waiter.WaiterViewModel
import com.google.android.material.chip.Chip
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class WaiterMenuFragment : Fragment() {

    private var _binding: FragmentWaiterMenuBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WaiterViewModel by activityViewModels()

    private lateinit var menuAdapter: WaiterMenuAdapter
    private var allDishes: List<Dish> = emptyList()
    private var selectedCategoryId: Int? = null
    private var searchQuery: String = ""

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentWaiterMenuBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupSearch()
        setupListeners()
        observeViewModel()

        viewModel.loadMenu()
    }

    private fun setupRecyclerView() {
        menuAdapter = WaiterMenuAdapter { dish ->
            // Tap en platillo — podrías abrir un detalle si existiera
        }
        binding.rvDishes.apply {
            layoutManager = GridLayoutManager(requireContext(), 2)
            adapter = menuAdapter
        }
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                searchQuery = s.toString()
                filterDishes()
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener {
            requireActivity().onBackPressedDispatcher.onBackPressed()
        }

        binding.btnToggleView.setOnClickListener {
            menuAdapter.isGridView = !menuAdapter.isGridView
            if (menuAdapter.isGridView) {
                binding.rvDishes.layoutManager = GridLayoutManager(requireContext(), 2)
                binding.btnToggleView.setImageResource(R.drawable.ic_menu_grid)
            } else {
                binding.rvDishes.layoutManager = LinearLayoutManager(requireContext())
                binding.btnToggleView.setImageResource(R.drawable.ic_menu_list)
            }
        }

        binding.swipeRefreshMenu.setOnRefreshListener {
            viewModel.loadMenu()
        }
        binding.swipeRefreshMenu.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun observeViewModel() {
        viewModel.dishes.observe(viewLifecycleOwner) { result ->
            binding.swipeRefreshMenu.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                allDishes = result.data
                filterDishes()
            }
        }

        viewModel.categories.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                populateCategories(result.data)
            }
        }
    }

    private fun populateCategories(categories: List<com.codex.foodify.data.model.DishCategory>) {
        binding.chipGroupCategories.removeAllViews()
        
        // Chip "Todos" - Siempre se añade
        val chipAll = LayoutInflater.from(requireContext()).inflate(R.layout.layout_chip_filter, binding.chipGroupCategories, false) as Chip
        chipAll.text = "Todos"
        chipAll.id = View.generateViewId()
        chipAll.isChecked = selectedCategoryId == null
        chipAll.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) {
                selectedCategoryId = null
                filterDishes()
            }
        }
        binding.chipGroupCategories.addView(chipAll)

        // Chips para categorías dinámicas
        for (category in categories) {
            val chip = LayoutInflater.from(requireContext()).inflate(R.layout.layout_chip_filter, binding.chipGroupCategories, false) as Chip
            chip.text = category.name
            chip.id = View.generateViewId()
            chip.isChecked = selectedCategoryId == category.id
            chip.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) {
                    selectedCategoryId = category.id
                    filterDishes()
                } else if (selectedCategoryId == category.id) {
                     // Si se deselecciona y no hay otro seleccionado, volver a Todos
                     if (binding.chipGroupCategories.checkedChipId == View.NO_ID) {
                         chipAll.isChecked = true
                     }
                }
            }
            binding.chipGroupCategories.addView(chip)
        }
    }

    private fun filterDishes() {
        val filtered = allDishes.filter { dish ->
            val matchesSearch = dish.name.contains(searchQuery, ignoreCase = true) || 
                               (dish.description?.contains(searchQuery, ignoreCase = true) ?: false)
            val matchesCategory = selectedCategoryId == null || dish.categoryId == selectedCategoryId
            matchesSearch && matchesCategory
        }
        menuAdapter.submitList(filtered)
        binding.layoutEmpty.visibility = if (filtered.isEmpty()) View.VISIBLE else View.GONE
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
