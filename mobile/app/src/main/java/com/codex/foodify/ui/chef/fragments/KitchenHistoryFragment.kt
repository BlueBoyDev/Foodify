package com.codex.foodify.ui.chef.fragments

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.FragmentKitchenHistoryBinding
import com.codex.foodify.ui.chef.KitchenViewModel
import com.codex.foodify.ui.chef.adapters.KitchenHistoryAdapter
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import dagger.hilt.android.AndroidEntryPoint
import java.text.SimpleDateFormat
import java.util.*

@AndroidEntryPoint
class KitchenHistoryFragment : Fragment() {

    private var _binding: FragmentKitchenHistoryBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })

    private lateinit var adapter: KitchenHistoryAdapter
    private var selectedDate: Calendar = Calendar.getInstance()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentKitchenHistoryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupListeners()
        observeViewModel()
        
        // Cargar hoy por defecto
        viewModel.loadHistory()
    }

    private fun setupRecyclerView() {
        adapter = KitchenHistoryAdapter { order ->
            showArchiveConfirmDialog(order.id)
        }
        binding.rvKitchenHistory.layoutManager = LinearLayoutManager(requireContext())
        binding.rvKitchenHistory.adapter = adapter
    }

    private fun setupListeners() {
        binding.swipeRefresh.setOnRefreshListener {
            viewModel.loadHistory(dateFormat.format(selectedDate.time))
        }

        binding.btnDatePicker.setOnClickListener {
            showDatePicker()
        }

        binding.btnArchiveAll.setOnClickListener {
            showArchiveAllConfirmDialog()
        }
    }

    private fun observeViewModel() {
        viewModel.historyOrders.observe(viewLifecycleOwner) { result ->
            binding.swipeRefresh.isRefreshing = result is Result.Loading
            binding.progressBar.visibility = if (result is Result.Loading) View.VISIBLE else View.GONE
            
            when (result) {
                is Result.Success -> {
                    val list = result.data
                    adapter.submitList(list)
                    binding.layoutEmpty.visibility = if (list.isEmpty()) View.VISIBLE else View.GONE
                }
                is Result.Error -> {
                    Toast.makeText(requireContext(), result.message, Toast.LENGTH_SHORT).show()
                }
                else -> {}
            }
        }
    }

    private fun showDatePicker() {
        DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                selectedDate.set(year, month, dayOfMonth)
                val dateStr = dateFormat.format(selectedDate.time)
                binding.btnDatePicker.text = dateStr
                viewModel.loadHistory(dateStr)
            },
            selectedDate.get(Calendar.YEAR),
            selectedDate.get(Calendar.MONTH),
            selectedDate.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun showArchiveConfirmDialog(orderId: Int) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Archivar Comanda")
            .setMessage("¿Deseas ocultar esta comanda del historial de cocina? Seguirá disponible en los reportes de administración.")
            .setPositiveButton("Archivar") { _, _ ->
                viewModel.archiveOrder(orderId)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showArchiveAllConfirmDialog() {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Limpiar Historial")
            .setMessage("¿Deseas ocultar TODAS las comandas actualmente visibles del historial de cocina?")
            .setPositiveButton("Limpiar Todo") { _, _ ->
                viewModel.archiveAllHistory()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
