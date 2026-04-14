// RUTA: app/src/main/java/com/codex/foodify/ui/admin/inventory/InventoryFragment.kt
// Lista de lotes con colores de alerta: Verde=Disponible, Amarillo=Próximo, Rojo=Caducado
package com.codex.foodify.ui.admin.inventory

import android.os.Bundle
import android.view.*
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentInventoryBinding
import com.google.android.material.chip.Chip
import com.google.android.material.snackbar.Snackbar
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class InventoryFragment : Fragment() {

    private var _binding: FragmentInventoryBinding? = null
    private val binding get() = _binding!!
    private val viewModel: InventoryViewModel by activityViewModels()
    private lateinit var adapter: InventoryAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentInventoryBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupFilters()
        setupSearch()
        observeViewModel()

        viewModel.loadLots()
        viewModel.loadAlerts()

        binding.fabAddLot.setOnClickListener {
            AddLoteDialog.newInstance().show(childFragmentManager, "add_lot")
        }

        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadLots()
            viewModel.loadAlerts()
        }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun setupRecyclerView() {
        adapter = InventoryAdapter(
            onAdjust = { group ->
                // Abrir diálogo de nuevo lote pre-llenado con el nombre del insumo
                AddLoteDialog.newInstance(group.itemName, group.unit).show(childFragmentManager, "add_lot")
            },
            onEditLot = { lot ->
                // Abrir diálogo de edición de lote
                AddLoteDialog.newInstance(lot).show(childFragmentManager, "edit_lot")
            },
            onDeleteLot = { lot ->
                showDeleteConfirm(lot.id)
            }
        )
        binding.rvInventory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvInventory.adapter = adapter
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener { text ->
            viewModel.search(text?.toString() ?: "")
        }
    }

    private fun setupFilters() {
        val filters = listOf("Todos", "Disponible", "Próx. a caducar", "Caducado", "Sin stock")
        filters.forEach { label ->
            val chip = Chip(requireContext()).apply {
                text        = label
                isCheckable = true
                isChecked   = label == "Todos"
                chipCornerRadius = 50f
                setChipBackgroundColorResource(R.color.chip_selector)
                setTextColor(requireContext().getColorStateList(R.color.chip_text_selector))
            }
            chip.setOnCheckedChangeListener { _, checked ->
                if (checked) {
                    viewModel.filterByStatus(label)
                    for (i in 0 until binding.chipGroupFilters.childCount) {
                        val c = binding.chipGroupFilters.getChildAt(i) as? Chip
                        if (c != chip) c?.isChecked = false
                    }
                }
            }
            binding.chipGroupFilters.addView(chip)
        }
    }

    private fun observeViewModel() {
        viewModel.lots.observe(viewLifecycleOwner) { result ->
            when (result) {
                is Result.Loading -> binding.swipeRefresh.isRefreshing = true
                is Result.Success -> {
                    binding.swipeRefresh.isRefreshing = false
                    adapter.submitList(result.data)
                    binding.tvEmptyState.visibility =
                        if (result.data.isEmpty()) View.VISIBLE else View.GONE
                }
                is Result.Error -> {
                    binding.swipeRefresh.isRefreshing = false
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG).show()
                }
                else -> {
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }

        viewModel.alerts.observe(viewLifecycleOwner) { alerts ->
            val count = alerts.count { !it.isResolved }
            binding.tvAlertBadge.text = count.toString()
            binding.tvAlertBadge.visibility = if (count > 0) View.VISIBLE else View.GONE
        }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            if (result is Result.Error) {
                Snackbar.make(binding.root, result.message, Snackbar.LENGTH_SHORT).show()
            }
        }
    }

    private fun showDeleteConfirm(lotId: Int) {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Dar de baja lote")
            .setMessage("¿Confirmas la baja por merma? Se registrará el movimiento.")
            .setPositiveButton("Confirmar") { _, _ -> viewModel.deleteLot(lotId) }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
