// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierOrdersFragment.kt
package com.codex.foodify.ui.cashier

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.databinding.FragmentCashierOrdersBinding
import com.codex.foodify.ui.cashier.adapters.AllOrdersAdapter
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CashierOrdersFragment : Fragment() {

    private lateinit var binding: FragmentCashierOrdersBinding
    private val viewModel: CashierViewModel by activityViewModels()
    private lateinit var adapter: AllOrdersAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentCashierOrdersBinding.inflate(inflater, container, false)
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
        adapter = AllOrdersAdapter(
            onDeliverDineIn = { order ->
                showDeliveryConfirmDialog(order)
            },
            onScanQr = { order ->
                findNavController().navigate(R.id.qrScanner)
            },
            onManualDeliver = { order ->
                showDeliveryConfirmDialog(order)
            },
            onEditOrder = { orderDto ->
                com.codex.foodify.ui.waiter.tables.NewOrderBottomSheet.newInstanceForEdit(orderDto).apply {
                    setOnOrderCompletedListener { viewModel.loadData() }
                }.show(childFragmentManager, "edit_order_${orderDto.id}")
            }
        )
        binding.ordersRecycler.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@CashierOrdersFragment.adapter
        }
    }

    private fun observeViewModel() {
        viewModel.filteredOrders.observe(viewLifecycleOwner) { orders ->
            adapter.submitList(orders)
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.swipeRefresh.isRefreshing = isLoading
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            if (error != null) {
                Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
                viewModel.clearMessages()
            }
        }
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadData()
        }

        binding.chipAll.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) viewModel.setOrderFilter("Todos")
        }

        binding.chipTakeout.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) viewModel.setOrderFilter("Para Llevar")
        }

        binding.chipDineIn.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) viewModel.setOrderFilter("En Mesa")
        }

        binding.chipReady.setOnCheckedChangeListener { _, isChecked ->
            if (isChecked) viewModel.setOrderFilter("Listos")
        }
    }

    private fun showDeliveryConfirmDialog(order: com.codex.foodify.data.model.OrderDto) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Confirmar Entrega")
            .setMessage("¿Estás seguro de que deseas marcar el folio #${order.orderNumber} como entregado?")
            .setPositiveButton("Entregar") { _, _ ->
                viewModel.deliverOrder(
                    order = order,
                    onValidationError = { msg ->
                        Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG)
                            .setBackgroundTint(requireContext().getColor(R.color.urgent_red))
                            .show()
                    },
                    onSuccess = {
                        // El mensaje de éxito lo maneja el observer del successMsg del ViewModel
                    }
                )
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
}

