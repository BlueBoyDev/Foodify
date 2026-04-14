// RUTA: app/src/main/java/com/codex/foodify/ui/admin/inventory/AddLoteDialog.kt
package com.codex.foodify.ui.admin.inventory

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.*
import android.widget.ArrayAdapter
import androidx.fragment.app.activityViewModels
import com.codex.foodify.data.model.InventoryLot
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.DialogAddLoteBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson
import java.text.SimpleDateFormat
import java.util.*

class AddLoteDialog : BottomSheetDialogFragment() {

    private var _binding: DialogAddLoteBinding? = null
    private val binding get() = _binding!!
    private val viewModel: InventoryViewModel by activityViewModels()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    private val displayFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())

    private var lotToEdit: InventoryLot? = null
    private var prefillName: String? = null
    private var prefillUnit: String? = null

    private var entryDateIso: String? = null
    private var expiryDateIso: String? = null

    companion object {
        fun newInstance(itemName: String? = null, unit: String? = null) = AddLoteDialog().apply {
            arguments = Bundle().apply {
                putString("itemName", itemName)
                putString("unit", unit)
            }
        }

        fun newInstance(lot: InventoryLot) = AddLoteDialog().apply {
            arguments = Bundle().apply {
                putString("lotJson", Gson().toJson(lot))
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let { args ->
            prefillName = args.getString("itemName")
            prefillUnit = args.getString("unit")
            args.getString("lotJson")?.let {
                lotToEdit = Gson().fromJson(it, InventoryLot::class.java)
            }
        }
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = DialogAddLoteBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUnitSelector()
        setupDatePickers()

        val today = Calendar.getInstance()
        entryDateIso = dateFormat.format(today.time)
        binding.etEntryDate.setText(displayFormat.format(today.time))

        // Si es edición
        lotToEdit?.let { lot ->
            binding.etItemName.setText(lot.item?.name)
            binding.etItemName.isEnabled = false // No editar nombre si es lote específico
            binding.etQuantity.setText(lot.remaining.toString())
            binding.etUnit.setText(lot.item?.unit ?: "kg", false)
            binding.etSupplier.setText(lot.supplier)
            binding.etLotNumber.setText(lot.lotNumber)
            binding.etUnitCost.setText(lot.unitCost.toString())
            
            lot.entryDate.let { date ->
                // Asumimos formato yyyy-mm-dd del backend
                try {
                    val d = dateFormat.parse(date)
                    if (d != null) {
                        entryDateIso = date
                        binding.etEntryDate.setText(displayFormat.format(d))
                    }
                } catch (e: Exception) {}
            }
            
            lot.expiryDate?.let { date ->
                try {
                    val d = dateFormat.parse(date)
                    if (d != null) {
                        expiryDateIso = date
                        binding.etExpiryDate.setText(displayFormat.format(d))
                    }
                } catch (e: Exception) {}
            }
        } ?: run {
            // Si es pre-llenado (Agregar Stock)
            prefillName?.let { binding.etItemName.setText(it) }
            prefillUnit?.let { binding.etUnit.setText(it, false) }
        }

        binding.btnSave.setOnClickListener {
            val name      = binding.etItemName.text.toString().trim()
            val quantity  = binding.etQuantity.text.toString().toDoubleOrNull()
            val unitCost  = binding.etUnitCost.text.toString().toDoubleOrNull()
            val unit      = binding.etUnit.text.toString().trim()

            if (name.isEmpty())  { binding.tilItemName.error = "Nombre requerido"; return@setOnClickListener }
            if (quantity == null){ binding.tilQuantity.error = "Cantidad requerida"; return@setOnClickListener }
            if (unitCost == null){ binding.tilUnitCost.error = "Costo requerido"; return@setOnClickListener }

            if (lotToEdit != null) {
                // Para actualización, el backend solo permite campos descriptivos del lote
                val updateReq = mutableMapOf<String, Any?>(
                    "lotNumber"  to binding.etLotNumber.text.toString().trim(),
                    "expiryDate" to expiryDateIso,
                    "supplier"   to binding.etSupplier.text.toString().trim(),
                    "quantity"   to quantity // Se mapea a remaining en el backend
                )
                viewModel.updateLot(lotToEdit!!.id, updateReq)
            } else {
                val req = mutableMapOf<String, Any?>(
                    "itemName"   to name,
                    "unit"       to unit,
                    "quantity"   to quantity,
                    "unitCost"   to unitCost,
                    "entryDate"  to entryDateIso,
                    "expiryDate" to expiryDateIso,
                    "supplier"   to binding.etSupplier.text.toString().trim(),
                    "lotNumber"  to binding.etLotNumber.text.toString().trim()
                )
                viewModel.createLotLegacy(req)
            }
        }

        viewModel.resetActionState()
        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) dismiss()
        }

        binding.btnCancel.setOnClickListener { dismiss() }
    }

    private fun setupUnitSelector() {
        val units = arrayOf(
            "Gramo (g)", "Kilogramo (kg)", "Litro (L)", "Mililitro (ml)", 
            "Pieza (pz)", "Bulto", "Caja", "Docena (doc)", 
            "Porción", "Onza (oz)", "Galón (gal)", "Paquete", "Lata", "Frasco"
        )
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_dropdown_item_1line, units)
        binding.etUnit.setAdapter(adapter)
    }

    private fun setupDatePickers() {
        binding.etEntryDate.setOnClickListener {
            val initial = entryDateIso?.let { try { dateFormat.parse(it) } catch(e:Exception){null} }
            showDatePicker(initial) { date ->
                binding.etEntryDate.setText(displayFormat.format(date))
                entryDateIso = dateFormat.format(date)
            }
        }
        binding.etExpiryDate.setOnClickListener {
            val initial = expiryDateIso?.let { try { dateFormat.parse(it) } catch(e:Exception){null} }
            showDatePicker(initial) { date ->
                binding.etExpiryDate.setText(displayFormat.format(date))
                expiryDateIso = dateFormat.format(date)
            }
        }
    }

    private fun showDatePicker(initialDate: Date? = null, onSelected: (Date) -> Unit) {
        val cal = Calendar.getInstance()
        initialDate?.let { cal.time = it }
        DatePickerDialog(requireContext(), { _, y, m, d ->
            val sel = Calendar.getInstance().apply { set(y, m, d) }
            onSelected(sel.time)
        }, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH), cal.get(Calendar.DAY_OF_MONTH)).show()
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
