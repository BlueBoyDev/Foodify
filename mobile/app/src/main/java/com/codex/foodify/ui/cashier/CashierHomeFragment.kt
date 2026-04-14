// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierHomeFragment.kt
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
import com.codex.foodify.databinding.FragmentCashierHomeBinding
import com.codex.foodify.ui.cashier.adapters.ReadyOrdersAdapter
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class CashierHomeFragment : Fragment() {

    private lateinit var binding: FragmentCashierHomeBinding
    private val viewModel: CashierViewModel by activityViewModels()
    private lateinit var adapter: ReadyOrdersAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentCashierHomeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupHeader()
        observeViewModel()
        setupListeners()
    }

    private fun setupHeader() {
        binding.headerLayout.tvHeaderTitle.text = getString(R.string.app_name)
        binding.headerLayout.tvHeaderSubtitle.text = getString(R.string.cashier_panel)
        binding.headerLayout.layoutUserBadge.visibility = View.VISIBLE
        binding.headerLayout.tvRoleLabel.text = "Cajero de Turno"
        
        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.headerLayout.tvUserName.text = name ?: "Cajero"
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadData()
    }

    private fun setupRecyclerView() {
        adapter = ReadyOrdersAdapter(
            onDeliverDineIn = { order ->
                showDeliveryConfirmDialog(order)
            },
            onScanQr = { order ->
                findNavController().navigate(R.id.action_home_to_scanner)
            },
            onManualDeliver = { order ->
                showDeliveryConfirmDialog(order)
            },
            onEditOrder = { /* TODO: edit order */ }
        )
        binding.readyOrdersRecycler.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = this@CashierHomeFragment.adapter
        }
    }

    private fun observeViewModel() {
        viewModel.kpis.observe(viewLifecycleOwner) { kpis ->
            binding.kpiTakeoutPending.text = kpis.takeoutPending.toString()
            binding.kpiTablePending.text = kpis.tablePending.toString()
            binding.kpiCompletedToday.text = kpis.completedToday.toString()
            binding.kpiSalesToday.text = String.format("$%.2f", kpis.salesToday)
            binding.kpiReadyToDeliver.text = kpis.readyToDeliver.toString()
        }

        viewModel.readyOrders.observe(viewLifecycleOwner) { orders ->
            adapter.submitList(orders)
            binding.emptyState.visibility = if (orders.isEmpty()) View.VISIBLE else View.GONE
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.swipeRefresh.isRefreshing = isLoading
        }

        viewModel.successMsg.observe(viewLifecycleOwner) { msg ->
            if (msg != null) {
                Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
                viewModel.clearMessages()
            }
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

        binding.fabQrScanner.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_scanner)
        }
    }

    private fun showDeliveryConfirmDialog(order: com.codex.foodify.data.model.OrderDto) {
        val isReady = order.isReady()
        val title = if (isReady) "Confirmar Entrega" else "⚠️ Pedido no listo"
        val message = if (isReady) {
            "¿Estás seguro de que deseas marcar el folio #${order.orderNumber} como entregado?"
        } else {
            "Este pedido aún no ha sido marcado como LISTO por la cocina.\n\n" +
            "¿Deseas confirmar la entrega de todas formas?"
        }

        MaterialAlertDialogBuilder(requireContext())
            .setTitle(title)
            .setMessage(message)
            .setIcon(if (isReady) R.drawable.ic_check else R.drawable.ic_warning)
            .setPositiveButton(if (isReady) "Entregar" else "Entregar de todas formas") { _, _ ->
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

