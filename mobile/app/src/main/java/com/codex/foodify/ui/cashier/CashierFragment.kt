// RUTA: app/app/src/main/java/com/codex/foodify/ui/cashier/CashierFragment.kt
// Centro de pedidos del cajero: lista de órdenes + escaneo QR Para Llevar
package com.codex.foodify.ui.cashier

import android.os.Bundle
import android.view.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.OrderDto // Changed from Order
import com.codex.foodify.databinding.FragmentCashierBinding
import com.google.android.material.snackbar.Snackbar
import com.codex.foodify.ui.waiter.tables.NewOrderBottomSheet
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CashierFragment : Fragment() {

    private var _binding: FragmentCashierBinding? = null
    private val binding get() = _binding!!
    internal val viewModel: CashierViewModel by viewModels()
    private lateinit var adapter: CashierOrdersAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentCashierBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = CashierOrdersAdapter(
            onScanQr  = { orderDto -> launchQrScanner(orderDto) },
            onDeliver = { orderDto ->
                viewModel.deliverOrder(
                    order = orderDto,
                    onValidationError = { message ->
                        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG)
                            .setBackgroundTint(requireContext().getColor(R.color.status_occupied))
                            .show()
                    },
                    onSuccess = { deliveredOrder ->
                        // Success message handled by ViewModel's successMsg LiveData
                    }
                )
            },
            onEdit = { orderDto ->
                NewOrderBottomSheet.newInstanceForEdit(orderDto).apply {
                    setOnOrderCompletedListener { viewModel.loadData() }
                }.show(childFragmentManager, "edit_order_${orderDto.id}")
            }
        )
        binding.rvOrders.layoutManager = LinearLayoutManager(requireContext())
        binding.rvOrders.adapter = adapter

        observeViewModel()
        viewModel.loadData() // Changed from loadOrders()

        // Botón escanear QR nuevo (Para Llevar sin order_id conocido)
        binding.btnScanQr.setOnClickListener {
            QrScannerFragment.newInstance(orderId = null)
                .show(childFragmentManager, "qr_scan")
        }

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadData() } // Changed from loadOrders()
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun launchQrScanner(orderDto: OrderDto) { // Changed to OrderDto
        QrScannerFragment.newInstance(orderId = orderDto.id)
            .show(childFragmentManager, "qr_scan_${orderDto.id}")
    }

    private fun observeViewModel() {
        viewModel.readyOrders.observe(viewLifecycleOwner) { orders -> // Changed to readyOrders, no Result wrapper
            adapter.submitList(orders)
            binding.tvOrderCount.text = "${orders.size} órdenes activas"
            binding.tvEmptyState.visibility =
                if (orders.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.isLoading.observe(viewLifecycleOwner) {
            binding.swipeRefresh.isRefreshing = it
        }

        viewModel.successMsg.observe(viewLifecycleOwner) { message ->
            message?.let {
                Snackbar.make(binding.root, it, Snackbar.LENGTH_SHORT)
                    .setBackgroundTint(requireContext().getColor(R.color.status_available))
                    .show()
                viewModel.clearMessages() // Clear message after showing
            }
        }

        viewModel.error.observe(viewLifecycleOwner) { message ->
            message?.let {
                Snackbar.make(binding.root, it, Snackbar.LENGTH_LONG)
                    .setBackgroundTint(requireContext().getColor(R.color.status_occupied))
                    .show()
                viewModel.clearMessages() // Clear message after showing
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}