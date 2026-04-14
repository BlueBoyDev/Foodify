package com.codex.foodify.ui.admin.tables

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.databinding.FragmentAdminTablesBinding
import com.codex.foodify.data.repository.Result
import com.codex.foodify.data.repository.AuthRepository
import androidx.lifecycle.lifecycleScope
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class AdminTablesFragment : Fragment() {

    private var _binding: FragmentAdminTablesBinding? = null
    private val binding get() = _binding!!
    private val viewModel: AdminTablesViewModel by viewModels()
    private lateinit var adapter: AdminTablesAdapter

    @javax.inject.Inject
    lateinit var authRepository: AuthRepository

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentAdminTablesBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
        observeUserInfo()

        viewModel.loadTables()
    }

    private fun observeUserInfo() {
        viewLifecycleOwner.lifecycleScope.launchWhenStarted {
            authRepository.userName.collect { name ->
                binding.tvUserName.text = "Hola, $name"
            }
        }
    }

    private fun setupRecyclerView() {
        adapter = AdminTablesAdapter { table ->
            confirmDeleteTable(table)
        }
        binding.rvTables.layoutManager = LinearLayoutManager(requireContext())
        binding.rvTables.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener { findNavController().popBackStack() }
        
        binding.swipeRefresh.setOnRefreshListener { viewModel.loadTables() }
        
        binding.fabAddTable.setOnClickListener {
            showAddTableDialog()
        }
    }

    private fun observeViewModel() {
        viewModel.tables.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            if (result is Result.Success) {
                adapter.submitList(result.data)
            } else if (result is Result.Error) {
                Toast.makeText(requireContext(), result.message, Toast.LENGTH_SHORT).show()
            }
        }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                // Éxito ya manejado por el VM recargando la lista
            } else if (result is Result.Error) {
                Toast.makeText(requireContext(), result.message, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun showAddTableDialog() {
        val view = LayoutInflater.from(requireContext()).inflate(com.codex.foodify.R.layout.dialog_add_table, null)
        val etNumber = view.findViewById<TextInputEditText>(com.codex.foodify.R.id.et_table_number)
        val etCapacity = view.findViewById<TextInputEditText>(com.codex.foodify.R.id.et_table_capacity)

        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Nueva Mesa")
            .setView(view)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Agregar") { _, _ ->
                val numStr = etNumber.text.toString()
                val capStr = etCapacity.text.toString()
                if (numStr.isNotEmpty()) {
                    viewModel.addTable(numStr.toInt(), capStr.toIntOrNull() ?: 4)
                }
            }
            .show()
    }

    private fun confirmDeleteTable(table: com.codex.foodify.data.model.Table) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Eliminar Mesa")
            .setMessage("¿Estás seguro de que deseas eliminar la Mesa ${table.number}?")
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Eliminar") { _, _ ->
                viewModel.deleteTable(table.id)
            }
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
