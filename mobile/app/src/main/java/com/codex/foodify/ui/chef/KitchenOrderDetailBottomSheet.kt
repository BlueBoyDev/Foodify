package com.codex.foodify.ui.chef

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.data.model.KitchenOrderDto
import com.codex.foodify.data.model.KitchenOrderItemDto
import com.codex.foodify.databinding.BottomSheetKitchenOrderDetailBinding
import com.codex.foodify.databinding.ItemKitchenOrderItemDetailBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class KitchenOrderDetailBottomSheet : BottomSheetDialogFragment() {
 
    private var _binding: BottomSheetKitchenOrderDetailBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })
 
    private var order: KitchenOrderDto? = null
 
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        order = arguments?.getParcelable(ARG_ORDER)
    }
 
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = BottomSheetKitchenOrderDetailBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Observar cambios en el ViewModel para refrescar este panel en tiempo real
        viewModel.orders.observe(viewLifecycleOwner) { result ->
            if (result is com.codex.foodify.data.repository.Result.Success) {
                val currentId = order?.id ?: return@observe
                val updatedOrder = result.data.find { it.id == currentId }
                if (updatedOrder != null) {
                    refreshUI(updatedOrder)
                }
            }
        }
        
        order?.let { refreshUI(it) }
    }

    private fun refreshUI(currentOrder: KitchenOrderDto) {
        binding.tvOrderTitle.text = "Comanda #${currentOrder.orderNumber}"
        binding.tvOrderMeta.text = "${currentOrder.getDisplaySource()} • Mesero: ${currentOrder.waiterName ?: "N/A"} • Hace ${currentOrder.getFormattedElapsedTime()}"

        binding.rvItemsDetail.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = DetailItemsAdapter(currentOrder.items)
        }

        val allReady = currentOrder.items.all { it.status == "ready" || it.status == "served" }
        binding.btnCompleteOrder.isEnabled = allReady && currentOrder.kitchenStatus != "ready"
        
        if (currentOrder.kitchenStatus == "ready") {
            binding.btnCompleteOrder.text = "Comanda Lista"
            binding.btnCompleteOrder.alpha = 1.0f
        } else if (!allReady) {
            binding.btnCompleteOrder.text = "Items pendientes..."
            binding.btnCompleteOrder.alpha = 0.6f
        } else {
            binding.btnCompleteOrder.text = "Finalizar Comanda"
            binding.btnCompleteOrder.alpha = 1.0f
        }

        binding.btnCompleteOrder.setOnClickListener {
            viewModel.updateOrderStatus(currentOrder.id, "ready")
            dismiss()
        }
    }

    private inner class DetailItemsAdapter(private val items: List<KitchenOrderItemDto>) :
        RecyclerView.Adapter<DetailItemsAdapter.DetailViewHolder>() {

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DetailViewHolder {
            val b = ItemKitchenOrderItemDetailBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return DetailViewHolder(b)
        }

        override fun onBindViewHolder(holder: DetailViewHolder, position: Int) {
            val item = items[position]
            holder.binding.tvDishName.text = item.dishName
            holder.binding.tvQuantity.text = item.quantity.toString()
            holder.binding.cbReady.isChecked = item.status == "ready"
            
            holder.binding.tvDishName.setOnClickListener {
                viewModel.loadRecipe(item.dishId)
            }

            // Si ya está listo o servido, no permitimos retroceder el estado desde aquí (evita 400 Bad Request)
            if (item.status == "ready" || item.status == "served") {
                holder.binding.cbReady.isEnabled = false
                holder.binding.cbReady.alpha = 0.5f
            } else {
                holder.binding.cbReady.isEnabled = true
                holder.binding.cbReady.alpha = 1.0f
            }

            if (!item.specialNotes.isNullOrBlank()) {
                holder.binding.tvNotes.visibility = View.VISIBLE
                holder.binding.tvNotes.text = item.specialNotes
            } else {
                holder.binding.tvNotes.visibility = View.GONE
            }

            holder.binding.cbReady.setOnClickListener {
                if (holder.binding.cbReady.isChecked) {
                    viewModel.updateItemStatus(item.id, "ready")
                }
            }
        }

        override fun getItemCount() = items.size

        inner class DetailViewHolder(val binding: ItemKitchenOrderItemDetailBinding) : RecyclerView.ViewHolder(binding.root)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_ORDER = "arg_order"

        fun newInstance(order: KitchenOrderDto) = KitchenOrderDetailBottomSheet().apply {
            arguments = Bundle().apply {
                putParcelable(ARG_ORDER, order)
            }
        }
    }
}
