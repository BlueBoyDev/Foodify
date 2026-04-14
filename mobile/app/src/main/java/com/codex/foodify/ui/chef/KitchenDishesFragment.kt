package com.codex.foodify.ui.chef

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.GridLayoutManager
import com.codex.foodify.databinding.FragmentKitchenDishesBinding
import com.codex.foodify.data.model.RecipeDto
import com.codex.foodify.data.repository.Result
import android.widget.Toast
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class KitchenDishesFragment : Fragment() {

    private var _binding: FragmentKitchenDishesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })
    private lateinit var adapter: KitchenDishesAdapter
    private var isGridView = true

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentKitchenDishesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupSearch()
        setupToggleView()
        observeViewModel()
        
        viewModel.loadDishes()
    }

    private fun setupToggleView() {
        binding.btnToggleView.setOnClickListener {
            isGridView = !isGridView
            updateLayoutManager()
        }
    }

    private fun updateLayoutManager() {
        if (isGridView) {
            binding.rvDishes.layoutManager = GridLayoutManager(requireContext(), 2)
            binding.btnToggleView.setIconResource(com.codex.foodify.R.drawable.ic_list)
        } else {
            binding.rvDishes.layoutManager = androidx.recyclerview.widget.LinearLayoutManager(requireContext())
            binding.btnToggleView.setIconResource(com.codex.foodify.R.drawable.ic_grid)
        }
    }

    private fun setupRecyclerView() {
        adapter = KitchenDishesAdapter { dish ->
            // En lugar de mostrar el modal directo, pedimos los datos completos
            viewModel.loadRecipe(dish.id, dish.name, dish.images)
            // El observador en observeViewModel se encargará de mostrar el modal
        }
        binding.rvDishes.apply {
            layoutManager = GridLayoutManager(requireContext(), 2)
            adapter = this@KitchenDishesFragment.adapter
        }
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {
                // Filtrado local en el adapter
                adapter.filter(s.toString())
            }
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
        })
    }

    private fun observeViewModel() {
        viewModel.dishes.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                adapter.submitList(result.data)
                setupCategoryChips(result.data)
            }
        }

        // Observar cuando la receta cargue con todos sus ingredientes/pasos
        viewModel.currentRecipe.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                val recipe = result.data
                if (recipe != null) {
                    if (parentFragmentManager.findFragmentByTag("recipe_detail") == null) {
                        RecipeDetailBottomSheet.newInstance(
                            viewModel.clickedDishName ?: "Receta",
                            viewModel.clickedDishImages,
                            recipe
                        ).show(parentFragmentManager, "recipe_detail")
                    }
                } else {
                    Toast.makeText(requireContext(), "Este platillo no tiene receta configurada", Toast.LENGTH_SHORT).show()
                }
                viewModel.resetRecipeState()
            }
        }
    }

    private var currentCategories: List<String> = emptyList()

    private fun setupCategoryChips(dishes: List<com.codex.foodify.data.model.DishWithRecipeDto>) {
        val categories = dishes.mapNotNull { it.categoryName }
            .filter { it.isNotBlank() }
            .distinct()
            .sorted()
        
        // Evitar recrear si las categorías no han cambiado para no saturar el Main Thread
        if (categories == currentCategories && binding.chipGroupCategories.childCount > 0) return
        currentCategories = categories
        
        binding.chipGroupCategories.post {
            if (_binding == null) return@post
            binding.chipGroupCategories.removeAllViews()

            // Chip "Todos"
            val allChip = com.google.android.material.chip.Chip(requireContext()).apply {
                text = "Todos"
                isCheckable = true
                isChecked = true
                setChipBackgroundColorResource(com.codex.foodify.R.color.status_delivered_bg)
                setTextColor(requireContext().getColor(com.codex.foodify.R.color.status_delivered_text))
                setOnCheckedChangeListener { _, isChecked ->
                    if (isChecked) adapter.filter(binding.etSearch.text.toString(), "Todos")
                }
            }
            binding.chipGroupCategories.addView(allChip)

            categories.forEach { cat ->
                val chip = com.google.android.material.chip.Chip(requireContext()).apply {
                    text = cat
                    isCheckable = true
                    setChipBackgroundColorResource(com.codex.foodify.R.color.background_dark)
                    setTextColor(requireContext().getColor(com.codex.foodify.R.color.text_secondary))
                    setOnCheckedChangeListener { _, isChecked ->
                        if (isChecked) {
                            adapter.filter(binding.etSearch.text.toString(), cat)
                            setChipBackgroundColorResource(com.codex.foodify.R.color.status_delivered_bg)
                            setTextColor(requireContext().getColor(com.codex.foodify.R.color.status_delivered_text))
                        } else {
                            setChipBackgroundColorResource(com.codex.foodify.R.color.background_dark)
                            setTextColor(requireContext().getColor(com.codex.foodify.R.color.text_secondary))
                        }
                    }
                }
                binding.chipGroupCategories.addView(chip)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
