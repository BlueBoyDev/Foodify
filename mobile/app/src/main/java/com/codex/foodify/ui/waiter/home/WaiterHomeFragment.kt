// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/home/WaiterHomeFragment.kt
// Panel de inicio mesero — 4 KPI cards + Pedidos Recientes + botones Nueva Orden / Ver Menú
// Diseño: fondo oscuro #1A1A1A, cards #2A2A2A, íconos de colores (imagen 12 del prototipo)
package com.codex.foodify.ui.waiter.home

import android.os.Bundle
import android.view.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.Order
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentWaiterHomeBinding
import com.codex.foodify.ui.waiter.WaiterViewModel
import com.codex.foodify.ui.waiter.WaiterMainActivity
import androidx.navigation.fragment.findNavController
import dagger.hilt.android.AndroidEntryPoint
import java.text.NumberFormat
import java.util.Locale

@AndroidEntryPoint
class WaiterHomeFragment : Fragment() {

    private var _binding: FragmentWaiterHomeBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WaiterViewModel by activityViewModels()
    private val currencyFmt = NumberFormat.getCurrencyInstance(Locale("es", "MX"))

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentWaiterHomeBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecentOrdersList()
        observeViewModel()

        viewModel.loadAll()

        binding.btnNewOrder.setOnClickListener {
            (activity as? WaiterMainActivity)?.findViewById<com.google.android.material.bottomnavigation.BottomNavigationView>(R.id.bottom_nav_waiter)?.selectedItemId = R.id.tablesFragment
        }

        binding.btnViewMenu.setOnClickListener {
            findNavController().navigate(R.id.waiterMenuFragment)
        }

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadAll() }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun setupRecentOrdersList() {
        binding.rvRecentOrders.layoutManager = LinearLayoutManager(requireContext())
        binding.rvRecentOrders.adapter = RecentOrdersAdapter { order ->
            // Tap en pedido → navegar al detalle
        }
    }

    private fun observeViewModel() {
        viewModel.pendingOrders.observe(viewLifecycleOwner)  { binding.tvPendingCount.text  = it.toString() }
        viewModel.completedToday.observe(viewLifecycleOwner) { binding.tvCompletedCount.text = it.toString() }
        viewModel.inKitchen.observe(viewLifecycleOwner)      { binding.tvInKitchenCount.text = it.toString() }
        viewModel.salesToday.observe(viewLifecycleOwner)     { binding.tvSalesToday.text = currencyFmt.format(it) }

        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.tvWaiterName.text = "Hola, $name"
        }

        viewModel.activeOrders.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                val recent = result.data.sortedByDescending { it.createdAt }.take(5)
                (binding.rvRecentOrders.adapter as RecentOrdersAdapter).submitList(recent)
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
