package com.codex.foodify.ui.waiter.tables

import android.os.Bundle
import android.view.*
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.codex.foodify.data.model.CreateOrderItemRequest
import com.codex.foodify.data.model.CreateOrderRequest
import com.codex.foodify.data.model.Dish
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.BottomSheetNewOrderBinding
import com.codex.foodify.ui.waiter.WaiterViewModel
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.chip.Chip
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class NewOrderBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetNewOrderBinding? = null
    private val binding get() = _binding!!
    private val viewModel: WaiterViewModel by activityViewModels()
    @Inject lateinit var repository: FoodifyRepository

    private var tableId: Int = 0
    private var tableNumber: Int = 0
    private var orderId: Int? = null
    private var isEditMode: Boolean = false
    private val cart = mutableMapOf<Int, Pair<Dish, Int>>() // dishId → (dish, qty)
    private var allDishes: List<Dish> = emptyList()
    private var onOrderCompleted: (() -> Unit)? = null

    fun setOnOrderCompletedListener(listener: () -> Unit) {
        this.onOrderCompleted = listener
    }

    companion object {
        fun newInstance(tableId: Int, tableNumber: Int) = NewOrderBottomSheet().apply {
            arguments = Bundle().apply {
                putInt("tableId", tableId)
                putInt("tableNumber", tableNumber)
            }
        }

        fun newInstanceForEdit(order: com.codex.foodify.data.model.OrderDto) = NewOrderBottomSheet().apply {
            arguments = Bundle().apply {
                putInt("orderId", order.id)
                putInt("tableId", order.tableId ?: 0)
                putInt("tableNumber", order.tableNumber ?: 0)
                putBoolean("isEditMode", true)
            }
        }

        fun newInstanceForEditOrder(order: com.codex.foodify.data.model.Order) = NewOrderBottomSheet().apply {
            arguments = Bundle().apply {
                putInt("orderId", order.id)
                putInt("tableId", order.table?.id ?: 0)
                putInt("tableNumber", order.table?.number ?: 0)
                putBoolean("isEditMode", true)
            }
        }
    }

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        tableId     = arguments?.getInt("tableId") ?: 0
        tableNumber = arguments?.getInt("tableNumber") ?: 0
        orderId     = arguments?.getInt("orderId")?.takeIf { it > 0 }
        isEditMode  = arguments?.getBoolean("isEditMode") ?: false
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = BottomSheetNewOrderBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        binding.tvTitle.text = if (isEditMode) "Editar Orden — #$orderId" 
                              else "Nueva Orden — Mesa $tableNumber"
        
        if (isEditMode) {
            binding.btnConfirmOrder.text = "Guardar Cambios"
        }

        // Lista de platillos disponibles
        val dishAdapter = SelectDishAdapter { dish, qty ->
            if (qty > 0) cart[dish.id] = Pair(dish, qty)
            else cart.remove(dish.id)
            updateCartTotal()
        }
        binding.rvDishes.layoutManager = LinearLayoutManager(requireContext())
        binding.rvDishes.adapter = dishAdapter

        // Cargar platillos
        viewLifecycleOwner.lifecycleScope.launch {
            val result = repository.getDishes()
            if (result is Result.Success) {
                allDishes = result.data
                setupCategoryChips()
                
                if (isEditMode && orderId != null) {
                    preFillCart()
                }
                
                dishAdapter.submitList(allDishes)
                updateCartTotal()
            }
        }

        binding.btnConfirmOrder.setOnClickListener { confirmOrder() }
        binding.btnCancel.setOnClickListener { dismiss() }
    }

    private fun setupCategoryChips() {
        binding.chipGroupCategories.removeAllViews()

        val uniqueCategories = mutableListOf("Todos")
        allDishes.forEach { d ->
            val cat = d.category?.name ?: "Sin Categoría"
            if (!uniqueCategories.contains(cat)) uniqueCategories.add(cat)
        }

        uniqueCategories.forEach { catName ->
            val chip = Chip(requireContext())
            chip.text = catName
            chip.isCheckable = true
            chip.isChecked = catName == "Todos"
            
            // Cuando se presiona, si se checkea, usarla como filtro superior.
            chip.setOnCheckedChangeListener { _, isChecked ->
                if (isChecked) filterDishes(catName)
            }
            
            binding.chipGroupCategories.addView(chip)
        }
    }

    private fun filterDishes(categoryName: String) {
        if (categoryName == "Todos") {
            (binding.rvDishes.adapter as SelectDishAdapter).submitList(allDishes)
        } else {
            val filtered = allDishes.filter { (it.category?.name ?: "Sin Categoría") == categoryName }
            (binding.rvDishes.adapter as SelectDishAdapter).submitList(filtered)
        }
    }

    private fun preFillCart() {
        // Obtenemos los items de la orden actual para precargar el carrito
        viewLifecycleOwner.lifecycleScope.launch {
            val result = repository.getOrderByIdDto(orderId!!)
            if (result is Result.Success) {
                val order = result.data
                order.items.forEach { item ->
                    val dish = allDishes.find { it.id == item.dishId }
                    if (dish != null) {
                        cart[dish.id] = Pair(dish, item.quantity)
                    }
                }
                updateCartTotal()
                // Forzar actualización del adaptador para mostrar cantidades actuales
                (binding.rvDishes.adapter as? SelectDishAdapter)?.updateCart(cart)
            }
        }
    }

    private fun updateCartTotal() {
        val total = cart.values.sumOf { (dish, qty) -> dish.displayPrice * qty }
        binding.tvCartTotal.text = "$${String.format("%.2f", total)}"
        binding.btnConfirmOrder.isEnabled = cart.isNotEmpty()
    }

    private fun confirmOrder() {
        if (cart.isEmpty()) return
        val items = cart.values.map { (dish, qty) ->
            CreateOrderItemRequest(dishId = dish.id, quantity = qty)
        }
        val req = CreateOrderRequest(
            type = if (isEditMode) "dine_in" else "dine_in", // TODO: Preserve original type if takeout
            tableId = if (tableId > 0) tableId else null, 
            items = items
        )

        viewLifecycleOwner.lifecycleScope.launch {
            val result = if (isEditMode) {
                repository.updateOrderDto(orderId!!, req)
            } else {
                repository.createOrder(req)
            }
            
            if (result is Result.Success) {
                // Notificar éxito al fragmento padre
                onOrderCompleted?.invoke()
                try { viewModel.loadAll() } catch (e: Exception) {}
                dismiss()
            }
        }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
