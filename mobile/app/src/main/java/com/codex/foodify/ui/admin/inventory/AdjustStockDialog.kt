// RUTA: app/src/main/java/com/codex/foodify/ui/admin/inventory/AdjustStockDialog.kt
// Jorge: "Descontar stock cuando se cocina algo" — PATCH /api/inventario/:id
package com.codex.foodify.ui.admin.inventory

import android.os.Bundle
import android.view.*
import androidx.fragment.app.activityViewModels
import com.codex.foodify.data.model.InventoryLot
import com.codex.foodify.databinding.DialogAdjustStockBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson

class AdjustStockDialog : BottomSheetDialogFragment() {

    private var _binding: DialogAdjustStockBinding? = null
    private val binding get() = _binding!!
    private val viewModel: InventoryViewModel by activityViewModels()
    private var lot: InventoryLot? = null

    companion object {
        fun newInstance(lot: InventoryLot) = AdjustStockDialog().apply {
            arguments = Bundle().apply { putString("lot", Gson().toJson(lot)) }
        }
    }

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        lot = Gson().fromJson(arguments?.getString("lot"), InventoryLot::class.java)
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = DialogAdjustStockBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        lot?.let { l ->
            binding.tvLotInfo.text = "${l.item?.name ?: "Lote #${l.id}"} — Stock: ${l.remaining} ${l.item?.unit ?: ""}"
        }

        // Positivo = entrada, negativo = descuento (Jorge)
        binding.rgAdjustType.setOnCheckedChangeListener { _, checkedId ->
            binding.tvAdjustHint.text = when (checkedId) {
                binding.rbDiscount.id -> "Ingresa la cantidad a descontar (ej: 5)"
                else                  -> "Ingresa la cantidad a añadir (ej: 10)"
            }
        }

        binding.btnConfirm.setOnClickListener {
            val qty = binding.etQuantity.text.toString().toDoubleOrNull()
            if (qty == null || qty <= 0) {
                binding.tilQuantity.error = "Cantidad inválida"
                return@setOnClickListener
            }
            val notes = binding.etNotes.text.toString().trim().ifEmpty { null }
            val isDiscount = binding.rbDiscount.isChecked
            val finalQty = if (isDiscount) -qty else qty
            viewModel.adjustStock(lot!!.id, finalQty, notes)
            dismiss()
        }

        binding.btnCancel.setOnClickListener { dismiss() }
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
