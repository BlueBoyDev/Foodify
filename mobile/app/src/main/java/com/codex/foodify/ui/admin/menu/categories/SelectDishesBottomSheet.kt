// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/SelectDishesBottomSheet.kt
package com.codex.foodify.ui.admin.menu.categories

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.BottomSheetSelectDishesBinding
import com.codex.foodify.ui.admin.dishes.DishesViewModel
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

class SelectDishesBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetSelectDishesBinding? = null
    private val binding get() = _binding!!

    private val dishesViewModel: DishesViewModel by activityViewModels()
    private lateinit var adapter: SelectDishesAdapter

    var onDishesSelected: ((List<Int>) -> Unit)? = null

    companion object {
        fun newInstance() = SelectDishesBottomSheet()
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetSelectDishesBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupSearch()
        setupListeners()
        observeViewModel()

        dishesViewModel.loadDishes()
    }

    private fun setupRecyclerView() {
        adapter = SelectDishesAdapter { selectedIds ->
            binding.btnConfirm.text = "Añadir Seleccionados (${selectedIds.size})"
            binding.btnConfirm.isEnabled = selectedIds.isNotEmpty()
        }
        binding.rvDishes.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@SelectDishesBottomSheet.adapter
        }
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener { editable ->
            dishesViewModel.loadDishes(editable.toString())
        }
    }

    private fun setupListeners() {
        binding.btnConfirm.setOnClickListener {
            onDishesSelected?.invoke(adapter.getSelectedIds())
            dismiss()
        }
    }

    private fun observeViewModel() {
        dishesViewModel.dishes.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> binding.progressBar.visibility = View.VISIBLE
                is Result.Success -> {
                    binding.progressBar.visibility = View.GONE
                    adapter.submitList(result.data)
                }
                is Result.Error -> {
                    binding.progressBar.visibility = View.GONE
                    // Aquí podrías mostrar un error si quisieras
                }
                else -> {
                    binding.progressBar.visibility = View.GONE
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
