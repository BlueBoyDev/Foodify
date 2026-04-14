// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierHistoryFragment.kt
package com.codex.foodify.ui.cashier

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.databinding.FragmentCashierHistoryBinding
import com.codex.foodify.ui.cashier.adapters.HistoryOrdersAdapter
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CashierHistoryFragment : Fragment() {

    private lateinit var binding: FragmentCashierHistoryBinding
    private val viewModel: CashierViewModel by activityViewModels()
    private lateinit var adapter: HistoryOrdersAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentCashierHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        observeViewModel()
        setupListeners()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadData()
    }

    private fun setupRecyclerView() {
        adapter = HistoryOrdersAdapter()
        binding.historyRecycler.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@CashierHistoryFragment.adapter
        }
    }

    private fun observeViewModel() {
        viewModel.historyOrders.observe(viewLifecycleOwner) { orders ->
            adapter.submitList(orders)
        }
    }

    private fun setupListeners() {
        binding.btnDelivered.setOnClickListener {
            viewModel.setHistoryFilter("Entregados")
            binding.btnDelivered.isChecked = true
            binding.btnCancelled.isChecked = false
        }

        binding.btnCancelled.setOnClickListener {
            viewModel.setHistoryFilter("Cancelados")
            binding.btnDelivered.isChecked = false
            binding.btnCancelled.isChecked = true
        }
    }
}

