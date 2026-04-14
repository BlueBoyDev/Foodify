// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/tables/TablesFragment.kt
// Mapa de mesas en grid 2 columnas — colores: verde=disponible, rojo=ocupada, amarillo=reservada
// Diseño basado en imagen 13 del prototipo (modo oscuro)
package com.codex.foodify.ui.waiter.tables

import android.os.Bundle
import android.view.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.GridLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.Table
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentTablesBinding
import com.codex.foodify.ui.waiter.WaiterViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class TablesFragment : Fragment() {

    private var _binding: FragmentTablesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WaiterViewModel by activityViewModels()
    private lateinit var adapter: TablesAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentTablesBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = TablesAdapter { table ->
            // Tap en mesa disponible → crear nueva orden
            when (table.status) {
                "available" -> showNewOrderDialog(table)
                "occupied"  -> { /* TODO: Navegar al detalle del pedido de esta mesa */ }
                else        -> { /* reservada → mostrar opciones */ }
            }
        }

        binding.rvTables.layoutManager = GridLayoutManager(requireContext(), 2)
        binding.rvTables.adapter = adapter

        observeViewModel()
        viewModel.loadTables()

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadTables() }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun observeViewModel() {
        viewModel.tables.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                adapter.submitList(result.data)
                // Actualizar contadores en header
                val available = result.data.count { it.status == "available" }
                val occupied  = result.data.count { it.status == "occupied" }
                val reserved  = result.data.count { it.status == "reserved" }
                binding.tvAvailableCount.text = available.toString()
                binding.tvOccupiedCount.text  = occupied.toString()
                binding.tvReservedCount.text  = reserved.toString()
            }
        }
        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.tvWaiterNameTables.text = "Hola, $name"
        }
    }

    private fun showNewOrderDialog(table: Table) {
        NewOrderBottomSheet.newInstance(table.id, table.number)
            .show(childFragmentManager, "new_order")
        viewModel.updateTableStatus(table.id, "occupied")
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
