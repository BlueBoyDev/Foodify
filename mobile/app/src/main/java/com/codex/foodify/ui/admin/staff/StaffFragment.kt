// RUTA: app/src/main/java/com/codex/foodify/ui/admin/staff/StaffFragment.kt
// Lista de empleados — filtros por Rol y Estado — como el prototipo (imágenes 7, 8, 11)
package com.codex.foodify.ui.admin.staff

import android.os.Bundle
import android.view.*
import androidx.core.widget.addTextChangedListener
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.R
import com.codex.foodify.data.model.Staff
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentStaffBinding
import com.google.android.material.chip.Chip
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class StaffFragment : Fragment() {

    private var _binding: FragmentStaffBinding? = null
    private val binding get() = _binding!!
    private val viewModel: StaffViewModel by activityViewModels()
    private lateinit var adapter: StaffAdapter

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentStaffBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupRoleFilters()
        setupStatusFilters()
        setupSearch()
        observeViewModel()

        viewModel.loadStaff()

        binding.fabAddStaff.setOnClickListener {
            AddEditStaffDialog.newInstance(null).show(childFragmentManager, "add_staff")
        }
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadStaff() }
        binding.swipeRefresh.setColorSchemeResources(R.color.foodify_orange)
    }

    private fun setupRecyclerView() {
        adapter = StaffAdapter(
            onEdit   = { s -> AddEditStaffDialog.newInstance(s).show(childFragmentManager, "edit_staff") },
            onToggle = { s -> viewModel.toggleActive(s) },
            onDelete = { s -> showDeleteConfirmation(s) }
        )
        binding.rvStaff.layoutManager = LinearLayoutManager(requireContext())
        binding.rvStaff.adapter = adapter
    }

    private fun showDeleteConfirmation(s: Staff) {
        androidx.appcompat.app.AlertDialog.Builder(requireContext())
            .setTitle("Confirmar eliminación")
            .setMessage("¿Estás seguro de que deseas eliminar a ${s.displayName}? Esta acción desactivará al usuario permanentemente.")
            .setPositiveButton("Eliminar") { _, _ -> viewModel.deleteStaff(s.id.toInt()) }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun setupRoleFilters() {
        // Fila 1: filtros de rol — como en el prototipo (Todos los roles, Admin, Mesero, Cocina)
        listOf("Todos los roles", "Admin", "Mesero", "Cocina", "Cajero").forEach { label ->
            val chip = makeChip(label, label == "Todos los roles")
            chip.setOnCheckedChangeListener { _, checked ->
                if (checked) {
                    viewModel.filterByRole(label)
                    deselectSiblings(binding.chipGroupRoles, chip)
                }
            }
            binding.chipGroupRoles.addView(chip)
        }
    }

    private fun setupStatusFilters() {
        // Fila 2: filtros de estado — como en el prototipo (Todos, Activos, Inactivos)
        listOf("Todos", "Activos", "Inactivos").forEach { label ->
            val chip = makeChip(label, label == "Todos")
            chip.setOnCheckedChangeListener { _, checked ->
                if (checked) {
                    viewModel.filterByStatus(label)
                    deselectSiblings(binding.chipGroupStatus, chip)
                }
            }
            binding.chipGroupStatus.addView(chip)
        }
    }

    private fun setupSearch() {
        binding.etSearch.addTextChangedListener {
            // Delegar búsqueda al ViewModel
            viewModel.search(it?.toString() ?: "")
        }
    }

    private fun makeChip(label: String, checked: Boolean) = Chip(requireContext()).apply {
        text             = label
        isCheckable      = true
        isChecked        = checked
        chipCornerRadius = 50f
        setChipBackgroundColorResource(R.color.chip_selector)
        setTextColor(requireContext().getColorStateList(R.color.chip_text_selector))
    }

    private fun deselectSiblings(group: com.google.android.material.chip.ChipGroup, active: Chip) {
        for (i in 0 until group.childCount) {
            val c = group.getChildAt(i) as? Chip
            if (c != active) c?.isChecked = false
        }
    }

    private fun observeViewModel() {
        viewModel.staff.observe(viewLifecycleOwner) { result ->
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
                    binding.tvEmptyState.text    = result.message
                    binding.tvEmptyState.visibility = View.VISIBLE
                }
                else -> {
                    binding.swipeRefresh.isRefreshing = false
                }
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
