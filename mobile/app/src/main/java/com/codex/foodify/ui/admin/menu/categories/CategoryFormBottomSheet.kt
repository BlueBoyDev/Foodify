// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/categories/CategoryFormBottomSheet.kt
package com.codex.foodify.ui.admin.menu.categories

import android.app.TimePickerDialog
import android.os.Bundle
import android.view.*
import com.codex.foodify.data.model.Category
import com.codex.foodify.data.model.CategorySchedule
import com.codex.foodify.data.model.CreateCategoryRequest
import com.codex.foodify.data.model.UpdateCategoryRequest
import com.codex.foodify.databinding.BottomSheetCategoryFormBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson
import java.util.*

class CategoryFormBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetCategoryFormBinding? = null
    private val binding get() = _binding!!

    // Callbacks que el Fragment padre asigna antes de mostrar el sheet
    var onCategoryCreated: ((CreateCategoryRequest) -> Unit)? = null
    var onCategoryUpdated: ((UpdateCategoryRequest) -> Unit)? = null

    private var isEditMode = false
    private var categoryToEdit: Category? = null

    companion object {
        private const val ARG_CATEGORY = "category"
        private const val ARG_NEXT_SORT_ORDER = "next_sort_order"

        fun newInstanceCreate(nextSortOrder: Int): CategoryFormBottomSheet {
            return CategoryFormBottomSheet().apply {
                arguments = Bundle().apply {
                    putInt(ARG_NEXT_SORT_ORDER, nextSortOrder)
                }
            }
        }

        fun newInstanceEdit(category: Category): CategoryFormBottomSheet {
            return CategoryFormBottomSheet().apply {
                arguments = Bundle().apply {
                    putString(ARG_CATEGORY, Gson().toJson(category))
                }
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = BottomSheetCategoryFormBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupMode()
        setupTimePickers()
        setupButtons()
    }

    private fun setupMode() {
        val categoryJson = arguments?.getString(ARG_CATEGORY)
        if (categoryJson != null) {
            // Modo edición
            isEditMode = true
            categoryToEdit = Gson().fromJson(categoryJson, Category::class.java)
            binding.textViewTitle.text = "Editar Categoría"
            binding.textViewSubtitle.visibility = View.GONE
            populateFormWithCategory(categoryToEdit!!)
        } else {
            // Modo creación
            isEditMode = false
            binding.textViewTitle.text = "Nueva Categoría"
            binding.textViewSubtitle.visibility = View.VISIBLE
            val nextSortOrder = arguments?.getInt(ARG_NEXT_SORT_ORDER, 1) ?: 1
            binding.editTextSortOrder.setText(nextSortOrder.toString())
            binding.checkboxActive.isChecked = true
        }
    }

    private fun populateFormWithCategory(category: Category) {
        binding.editTextName.setText(category.name)
        binding.editTextDescription.setText(category.description ?: "")
        binding.editTextSortOrder.setText(category.sortOrder.toString())
        binding.editTextIcon.setText(category.icon ?: "")
        binding.checkboxActive.isChecked = category.isActive

        category.schedule?.let { schedule ->
            binding.editTextStartTime.setText(schedule.start)
            binding.editTextEndTime.setText(schedule.end)
        }
    }

    private fun setupTimePickers() {
        // Al tocar el campo de Hora de Inicio, abrir TimePickerDialog
        binding.editTextStartTime.setOnClickListener {
            showTimePicker { hour, minute ->
                binding.editTextStartTime.setText(
                    String.format("%02d:%02d", hour, minute)
                )
            }
        }
        // Al tocar el campo de Hora de Fin
        binding.editTextEndTime.setOnClickListener {
            showTimePicker { hour, minute ->
                binding.editTextEndTime.setText(
                    String.format("%02d:%02d", hour, minute)
                )
            }
        }
    }

    private fun showTimePicker(onTimeSelected: (Int, Int) -> Unit) {
        val currentHour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val currentMinute = Calendar.getInstance().get(Calendar.MINUTE)
        TimePickerDialog(
            requireContext(),
            { _, hour, minute -> onTimeSelected(hour, minute) },
            currentHour,
            currentMinute,
            true  // formato 24 horas
        ).show()
    }

    private fun setupButtons() {
        binding.buttonCancel.setOnClickListener { dismiss() }
        binding.buttonSave.setOnClickListener { validateAndSave() }
    }

    private fun validateAndSave() {
        val name = binding.editTextName.text.toString().trim()
        val description = binding.editTextDescription.text.toString().trim()
        val sortOrderText = binding.editTextSortOrder.text.toString().trim()
        val startTime = binding.editTextStartTime.text.toString().trim()
        val endTime = binding.editTextEndTime.text.toString().trim()
        val icon = binding.editTextIcon.text.toString().trim()
        val isActive = binding.checkboxActive.isChecked

        // Validación: nombre obligatorio
        if (name.isEmpty()) {
            binding.inputLayoutName.error = "El nombre es obligatorio"
            return
        } else {
            binding.inputLayoutName.error = null
        }

        // Validación: sort_order obligatorio y mayor a 0
        val sortOrder = sortOrderText.toIntOrNull()
        if (sortOrder == null || sortOrder < 1) {
            binding.inputLayoutSortOrder.error = "Ingresa un número válido (mínimo 1)"
            return
        } else {
            binding.inputLayoutSortOrder.error = null
        }

        // Validación: si hay una hora, la otra también es obligatoria
        val hasStartTime = startTime.isNotEmpty()
        val hasEndTime = endTime.isNotEmpty()

        if (hasStartTime && !hasEndTime) {
            binding.inputLayoutEndTime.error = "Define la hora de fin"
            return
        }
        if (!hasStartTime && hasEndTime) {
            binding.inputLayoutStartTime.error = "Define la hora de inicio"
            return
        }
        binding.inputLayoutStartTime.error = null
        binding.inputLayoutEndTime.error = null

        // Validación: hora de fin debe ser posterior a hora de inicio
        if (hasStartTime && hasEndTime) {
            val startParts = startTime.split(":")
            val endParts = endTime.split(":")
            if (startParts.size == 2 && endParts.size == 2) {
                val startMinutes = startParts[0].toInt() * 60 + startParts[1].toInt()
                val endMinutes = endParts[0].toInt() * 60 + endParts[1].toInt()
                if (endMinutes <= startMinutes) {
                    binding.inputLayoutEndTime.error = "La hora de fin debe ser posterior a la de inicio"
                    return
                }
            }
        }

        // Construir el schedule — null si no se definieron horas
        val schedule = if (hasStartTime && hasEndTime) {
            CategorySchedule(start = startTime, end = endTime)
        } else null

        val request = CreateCategoryRequest(
            name = name,
            description = description.ifEmpty { null },
            sortOrder = sortOrder,
            schedule = schedule,
            icon = icon.ifEmpty { null },
            isActive = isActive
        )

        if (isEditMode) {
            onCategoryUpdated?.invoke(request)
        } else {
            onCategoryCreated?.invoke(request)
        }

        dismiss()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
