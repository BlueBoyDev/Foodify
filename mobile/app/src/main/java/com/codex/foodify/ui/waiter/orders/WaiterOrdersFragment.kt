// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/orders/WaiterOrdersFragment.kt
// Lista de pedidos activos del mesero — permite marcar como entregado
package com.codex.foodify.ui.waiter.orders

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.databinding.BottomSheetMarkDeliveredBinding
import com.codex.foodify.databinding.FragmentWaiterOrdersBinding
import com.codex.foodify.ui.waiter.OrdersAdapter
import com.codex.foodify.ui.waiter.WaiterViewModel
import com.codex.foodify.utils.WebSocketManager
import com.google.android.material.bottomsheet.BottomSheetDialog
import com.google.android.material.chip.Chip
import com.google.android.material.snackbar.Snackbar
import com.google.zxing.integration.android.IntentIntegrator
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class WaiterOrdersFragment : Fragment() {
    @Inject
    lateinit var webSocketManager: WebSocketManager

    private var _binding: FragmentWaiterOrdersBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WaiterViewModel by activityViewModels()
    private lateinit var adapter: OrdersAdapter

    private val filterOptions = listOf("Todos", "Nuevos", "Cocina", "Listos", "Entregados")

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentWaiterOrdersBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupChips()
        setupSwipeRefresh()
        setupFab()
        observeViewModel()
        setupWebSocketListeners()

        // Cargar pedidos al iniciar
        viewModel.loadOrders()
    }

    private fun setupRecyclerView() {
        adapter = OrdersAdapter(
            onEdit = { orderDto ->
                com.codex.foodify.ui.waiter.tables.NewOrderBottomSheet.newInstanceForEdit(orderDto).apply {
                    setOnOrderCompletedListener { viewModel.loadOrders() }
                }.show(childFragmentManager, "edit_order_${orderDto.id}")
            },
            onClaim = { orderDto ->
                viewModel.claimOrder(orderDto.id) { success, message ->
                    Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
                }
            }
        )
        binding.rvOrders.layoutManager = LinearLayoutManager(requireContext())
        binding.rvOrders.adapter = adapter
    }

    private fun setupChips() {
        filterOptions.forEach { filter ->
            val chip = Chip(requireContext())
            chip.text = filter
            chip.id = View.generateViewId()
            chip.isCheckable = true
            chip.isChecked = filter == "Todos"

            // Estilo inicial
            if (filter == "Todos") {
                chip.setChipBackgroundColorResource(R.color.color_primary)
                chip.setTextColor(requireContext().getColor(android.R.color.white))
            }

            chip.setOnClickListener {
                updateChipStyles(chip)
                viewModel.setOrderFilter(filter)
            }

            binding.chipGroupFilters.addView(chip)
        }
    }

    private fun updateChipStyles(selectedChip: Chip) {
        for (i in 0 until binding.chipGroupFilters.childCount) {
            val chip = binding.chipGroupFilters.getChildAt(i) as Chip
            if (chip.id == selectedChip.id) {
                chip.setChipBackgroundColorResource(R.color.color_primary)
                chip.setTextColor(requireContext().getColor(android.R.color.white))
            } else {
                chip.setChipBackgroundColorResource(android.R.color.transparent)
                chip.setTextColor(requireContext().getColor(R.color.text_secondary))
            }
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadOrders()
        }
    }

    // ── FAB QR → mostrar bottom sheet ────────────────────────────────
    private fun setupFab() {
        binding.fabScanQr.setOnClickListener {
            showMarkDeliveredBottomSheet()
        }
    }

    private fun showMarkDeliveredBottomSheet() {
        val dialog = BottomSheetDialog(requireContext())
        val sheetBinding = BottomSheetMarkDeliveredBinding.inflate(layoutInflater)
        dialog.setContentView(sheetBinding.root)

        // Escanear QR con cámara
        sheetBinding.cardScanQr.setOnClickListener {
            dialog.dismiss()
            launchQrScanner()
        }

        // Ingreso manual del código
        sheetBinding.cardManualEntry.setOnClickListener {
            dialog.dismiss()
            showManualEntryDialog()
        }

        // Cancelar
        sheetBinding.cardCancel.setOnClickListener {
            dialog.dismiss()
        }

        dialog.show()
    }

    private fun launchQrScanner() {
        val integrator = IntentIntegrator.forSupportFragment(this)
        integrator.setDesiredBarcodeFormats(IntentIntegrator.QR_CODE)
        integrator.setPrompt("Escanea el QR de la orden Para Llevar")
        integrator.setBeepEnabled(true)
        integrator.initiateScan()
    }

    private fun showManualEntryDialog() {
        val input = EditText(requireContext()).apply {
            hint = "Ej: ORD-00123 o 123"
            inputType = android.text.InputType.TYPE_CLASS_TEXT
            setPadding(48, 24, 48, 24)
        }

        AlertDialog.Builder(requireContext())
            .setTitle("Ingresar código de orden")
            .setView(input)
            .setPositiveButton("Marcar entregado") { _, _ ->
                val code = input.text.toString().trim()
                val orderId = code.removePrefix("ORD-").toIntOrNull()
                if (orderId != null && orderId > 0) {
                    viewModel.scanQrOrder(orderId) { success, message ->
                        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
                        if (success) viewModel.loadOrders()
                    }
                } else {
                    Snackbar.make(binding.root, "Código inválido: \"$code\"", Snackbar.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)

        val result = IntentIntegrator.parseActivityResult(requestCode, resultCode, data)
        if (result != null) {
            if (result.contents != null) {
                val orderId = result.contents.toIntOrNull()
                if (orderId != null) {
                    viewModel.scanQrOrder(orderId) { success, message ->
                        Snackbar.make(binding.root, message, Snackbar.LENGTH_LONG).show()
                        if (success) viewModel.loadOrders()
                    }
                } else {
                    Snackbar.make(binding.root, "QR inválido", Snackbar.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun observeViewModel() {
        // Observar pedidos filtrados
        viewModel.filteredOrders.observe(viewLifecycleOwner) { orders ->
            adapter.submitList(orders)
            binding.emptyState.visibility = if (orders.isEmpty()) View.VISIBLE else View.GONE
            binding.swipeRefresh.isRefreshing = false
        }

        // Observar estado de carga
        viewModel.ordersLoading.observe(viewLifecycleOwner) { isLoading ->
            if (isLoading) {
                binding.swipeRefresh.isRefreshing = true
            }
        }

        // Observar errores
        viewModel.ordersError.observe(viewLifecycleOwner) { error ->
            error?.let {
                Snackbar.make(binding.root, it, Snackbar.LENGTH_LONG).show()
            }
        }
    }

    // ── WebSocket Listeners ──────────────────────────────────────────
    private val orderStatusHandler: com.codex.foodify.utils.SocketEventHandler = { json ->
        json?.let {
            val orderId = it.optInt("orderId", 0)
            val newStatus = it.optString("newStatus", "")
            val kitchenStatus = it.optString("kitchenStatus", "")
            if (orderId > 0) {
                activity?.runOnUiThread {
                    if (isAdded && _binding != null) {
                        viewModel.updateOrderFromWebSocket(orderId, newStatus, kitchenStatus)
                    }
                }
            }
        }
    }

    private val orderReadyHandler: com.codex.foodify.utils.SocketEventHandler = { json ->
        json?.let {
            val tableNumber = it.optInt("tableNumber", 0)
            activity?.runOnUiThread {
                if (isAdded && _binding != null) {
                    val msg = if (tableNumber > 0)
                        "Mesa $tableNumber lista para entregar"
                    else
                        "Orden lista para entregar"
                    Snackbar.make(binding.root, msg, Snackbar.LENGTH_LONG).show()
                    viewModel.loadOrders()
                }
            }
        }
    }

    private val orderUpdatedHandler: com.codex.foodify.utils.SocketEventHandler = { json ->
        json?.let {
            val orderId = it.optInt("orderId", 0)
            val waiterName = it.optString("waiterName", "")
            if (orderId > 0) {
                activity?.runOnUiThread {
                    if (isAdded && _binding != null) {
                        viewModel.updateOrderFromWebSocket(orderId, waiterName = waiterName)
                    }
                }
            }
        }
    }

    private val orderNewNotifHandler: com.codex.foodify.utils.SocketEventHandler = { json ->
        json?.let {
            val orderNumber = it.optString("orderNumber", "")
            activity?.runOnUiThread {
                if (isAdded && _binding != null) {
                    Snackbar.make(
                        binding.root, 
                        "🔔 ¡Nuevo pedido Para Llevar (#$orderNumber)! Pulsa para ver", 
                        Snackbar.LENGTH_INDEFINITE
                    ).setAction("VER") {
                        viewModel.setOrderFilter("Nuevos")
                        viewModel.loadOrders()
                    }.show()
                }
            }
        }
    }

    private fun setupWebSocketListeners() {
        webSocketManager.onOrderStatus(orderStatusHandler)
        webSocketManager.onOrderReady(orderReadyHandler)
        webSocketManager.onOrderUpdated(orderUpdatedHandler)
        webSocketManager.onOrderNewNotification(orderNewNotifHandler)
    }

    private fun removeWebSocketListeners() {
        webSocketManager.offOrderStatus(orderStatusHandler)
        webSocketManager.offOrderReady(orderReadyHandler)
        webSocketManager.offOrderUpdated(orderUpdatedHandler)
        webSocketManager.offOrderNewNotification(orderNewNotifHandler)
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadOrders()
    }

    override fun onDestroyView() {
        removeWebSocketListeners()
        super.onDestroyView()
        _binding = null
    }
}
