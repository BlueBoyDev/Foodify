package com.codex.foodify.ui.chef

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.databinding.FragmentKitchenOrdersBinding
import com.codex.foodify.data.repository.Result
import android.widget.Toast
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class KitchenOrdersFragment : Fragment() {

    private var _binding: FragmentKitchenOrdersBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })
    private lateinit var adapter: KitchenOrdersAdapter
    private var fullOrders: List<com.codex.foodify.data.model.KitchenOrderDto> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentKitchenOrdersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupFilters()
        observeViewModel()
        
        binding.swipeRefresh.setOnRefreshListener { viewModel.refreshData() }
    }

    private fun setupRecyclerView() {
        adapter = KitchenOrdersAdapter(
            onStartOrder = { order -> viewModel.updateOrderStatus(order.id, "preparing") },
            onReadyOrder = { order -> viewModel.updateOrderStatus(order.id, "ready") },
            onDetails = { order -> 
                KitchenOrderDetailBottomSheet.newInstance(order).show(childFragmentManager, "order_detail")
            }
        )
        binding.rvKitchenOrders.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@KitchenOrdersFragment.adapter
        }
    }

    private fun setupFilters() {
        binding.chipGroupFilters.setOnCheckedChangeListener { _, checkedId ->
            filterOrders(checkedId)
        }
    }

    private fun filterOrders(checkedId: Int) {
        val filtered = when (checkedId) {
            com.codex.foodify.R.id.chipPending -> fullOrders.filter { it.kitchenStatus.equals("pending", ignoreCase = true) }
            com.codex.foodify.R.id.chipPreparing -> fullOrders.filter { it.kitchenStatus.equals("preparing", ignoreCase = true) }
            com.codex.foodify.R.id.chip_delayed -> fullOrders.filter { it.getUrgencyLevel() == com.codex.foodify.data.model.UrgencyLevel.HIGH }
            else -> fullOrders
        }
        adapter.submitList(filtered)
        binding.tvActiveOrdersCount.text = filtered.size.toString()
    }

    private fun observeViewModel() {
        viewModel.orders.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                fullOrders = result.data
                filterOrders(binding.chipGroupFilters.checkedChipId)
                binding.layoutEmpty.visibility = if (result.data.isEmpty()) View.VISIBLE else View.GONE
            }
        }
        viewModel.stats.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                binding.tvCompletedTodayCount.text = result.data.completedToday.toString()
                binding.tvAvgTime.text = if (result.data.avgPrepTimeMin > 0) {
                    "${String.format("%.1f", result.data.avgPrepTimeMin)}m"
                } else {
                    "0m"
                }
            }
        }

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
            } else if (result is Result.Error) {
                Toast.makeText(requireContext(), "Error al cargar receta: ${result.message}", Toast.LENGTH_SHORT).show()
                viewModel.resetRecipeState()
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.startPolling()
    }

    override fun onPause() {
        super.onPause()
        viewModel.stopPolling()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
