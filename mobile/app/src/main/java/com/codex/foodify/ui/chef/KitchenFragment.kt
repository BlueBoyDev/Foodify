// RUTA: app/src/main/java/com/codex/foodify/ui/chef/KitchenFragment.kt
// Board de comandas con alertas de urgencia por tiempo
// Borde ROJO = pending > 20 min | Borde NARANJA = preparing > 30 min
package com.codex.foodify.ui.chef

import android.os.Bundle
import android.view.*
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.repository.Result
import android.widget.Toast
import com.codex.foodify.databinding.FragmentKitchenBinding
import com.codex.foodify.data.model.KitchenSessionDto
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class KitchenFragment : Fragment() {

    private var _binding: FragmentKitchenBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels()
    private lateinit var adapter: KitchenAdapter
    private var fullOrders: List<com.codex.foodify.data.model.KitchenOrderDto> = emptyList()

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentKitchenBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        adapter = KitchenAdapter(
            onStartOrder  = { order -> viewModel.updateOrderStatus(order.id, "preparing") },
            onReadyOrder  = { order -> viewModel.updateOrderStatus(order.id, "ready") },
            onItemStatus  = { itemId, status -> viewModel.updateItemStatus(itemId, status) },
            onEdit        = { orderDto ->
                // NOTA: NewOrderBottomSheet espera un 'Order', pero aquí tenemos 'KitchenOrderDto'.
                viewModel.loadOrders()
            },
            onRecipeClick = { dishId -> 
                // Buscamos el nombre e imagen si es posible desde las órdenes cargadas
                val dish = fullOrders.flatMap { it.items }.find { it.dishId == dishId }
                viewModel.loadRecipe(dishId, dish?.dishName, null) 
            }
        )

        binding.rvKitchenOrders.layoutManager = LinearLayoutManager(requireContext())
        binding.rvKitchenOrders.adapter = adapter

        setupFilters()
        observeViewModel()

        // Iniciar sesión de turno
        binding.btnStartSession.setOnClickListener {
            viewModel.startSession()
            binding.btnStartSession.visibility = View.GONE
            binding.btnEndSession.visibility   = View.VISIBLE
            viewModel.startPolling()
        }

        binding.btnEndSession.setOnClickListener {
            val session = viewModel.session.value
            if (session != null) {
                viewModel.endSession(session.id)
                viewModel.stopPolling()
                binding.btnStartSession.visibility = View.VISIBLE
                binding.btnEndSession.visibility   = View.GONE
            }
        }

        binding.swipeRefresh.setOnRefreshListener { viewModel.loadOrders() }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)

        viewModel.loadOrders()
    }

    private fun setupFilters() {
        binding.chipGroupFilters.setOnCheckedChangeListener { _, checkedId ->
            filterOrders(checkedId)
        }
    }

    private fun filterOrders(checkedId: Int) {
        val filtered = when (checkedId) {
            R.id.chip_pending -> fullOrders.filter { it.kitchenStatus.equals("pending", ignoreCase = true) }
            R.id.chip_preparing -> fullOrders.filter { it.kitchenStatus.equals("preparing", ignoreCase = true) }
            R.id.chip_ready -> fullOrders.filter { it.kitchenStatus.equals("ready", ignoreCase = true) }
            R.id.chip_delayed -> fullOrders.filter { it.getUrgencyLevel() == com.codex.foodify.data.model.UrgencyLevel.HIGH }
            else -> fullOrders
        }
        adapter.submitList(filtered)
        binding.tvCommandCount.text = "${filtered.size} comandas filtradas"
    }

    private fun observeViewModel() {
        viewModel.orders.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                fullOrders = result.data
                filterOrders(binding.chipGroupFilters.checkedChipId)
                binding.tvEmptyState.visibility =
                    if (result.data.isEmpty()) View.VISIBLE else View.GONE
                if (result.data.isEmpty()) {
                    binding.tvEmptyState.text = "Sin comandas activas"
                }
            }
        }

        viewModel.session.observe(viewLifecycleOwner) { session ->
            binding.tvSessionStatus.text = if (session != null)
                "Turno activo desde ${session.startedAt.take(16).replace("T", " ")}"
            else
                "Sin turno activo"
        }

        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.tvChefName.text = name ?: "Chef"
        }

        viewModel.currentRecipe.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                val recipe = result.data
                if (recipe != null) {
                    // Evitar duplicados revisando si ya existe por tag
                    if (childFragmentManager.findFragmentByTag("recipe_detail") == null) {
                        RecipeDetailBottomSheet.newInstance(
                            viewModel.clickedDishName ?: "Receta",
                            viewModel.clickedDishImages,
                            recipe
                        ).show(childFragmentManager, "recipe_detail")
                    }
                } else {
                    Toast.makeText(requireContext(), "Este platillo no tiene receta configurada", Toast.LENGTH_SHORT).show()
                }
                // Consumir el evento para que no se repita en rotaciones
                viewModel.resetRecipeState()
            } else if (result is Result.Error) {
                Toast.makeText(requireContext(), "Error al cargar receta: ${result.message}", Toast.LENGTH_SHORT).show()
                viewModel.resetRecipeState()
            }
        }
    }

    override fun onDestroyView() {
        viewModel.stopPolling()
        super.onDestroyView()
        _binding = null
    }
}
