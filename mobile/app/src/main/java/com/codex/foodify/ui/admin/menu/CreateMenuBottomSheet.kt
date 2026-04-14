// RUTA: app/src/main/java/com/codex/foodify/ui/admin/menu/CreateMenuBottomSheet.kt
package com.codex.foodify.ui.admin.menu

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.activityViewModels
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.CreateMenuRequest
import com.codex.foodify.data.model.Menu
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.DialogCreateMenuBinding
import com.codex.foodify.databinding.ItemTimeRangeBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.android.material.chip.Chip
import com.google.android.material.timepicker.MaterialTimePicker
import com.google.android.material.timepicker.TimeFormat

class CreateMenuBottomSheet : BottomSheetDialogFragment() {

    private var _binding: DialogCreateMenuBinding? = null
    private val binding get() = _binding!!
    private val viewModel: MenuViewModel by activityViewModels()

    private var editMenu: Menu? = null
    private val timeRanges = mutableListOf<TimeRange>()
    private lateinit var rangesAdapter: TimeRangesAdapter
 
    data class TimeRange(val start: String, val end: String)
 
    companion object {
        private const val ARG_MENU = "arg_menu"
        fun newInstance(menu: Menu? = null) = CreateMenuBottomSheet().apply {
            arguments = Bundle().apply {
                putParcelable(ARG_MENU, menu)
            }
        }
    }
 
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        editMenu = arguments?.getParcelable(ARG_MENU)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = DialogCreateMenuBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRangesList()
        setupListeners()
        populateIfEdit()
    }

    private fun setupRangesList() {
        rangesAdapter = TimeRangesAdapter(timeRanges) { pos ->
            timeRanges.removeAt(pos)
            rangesAdapter.notifyItemRemoved(pos)
        }
        binding.rvTimeRanges.apply {
            layoutManager = LinearLayoutManager(requireContext())
            adapter = rangesAdapter
        }
    }

    private fun setupListeners() {
        binding.btnAddTimeRange.setOnClickListener { showTimeRangePicker() }
        binding.btnCancel.setOnClickListener { dismiss() }
        binding.btnSave.setOnClickListener { saveMenu() }
    }

    private fun showTimeRangePicker() {
        val startPicker = MaterialTimePicker.Builder()
            .setTimeFormat(TimeFormat.CLOCK_24H)
            .setTitleText("Hora Inicio")
            .build()
            
        startPicker.addOnPositiveButtonClickListener {
            val startTime = String.format("%02d:%02d", startPicker.hour, startPicker.minute)
            
            val endPicker = MaterialTimePicker.Builder()
                .setTimeFormat(TimeFormat.CLOCK_24H)
                .setTitleText("Hora Fin")
                .build()
                
            endPicker.addOnPositiveButtonClickListener {
                val endTime = String.format("%02d:%02d", endPicker.hour, endPicker.minute)
                timeRanges.add(TimeRange(startTime, endTime))
                rangesAdapter.notifyItemInserted(timeRanges.size - 1)
            }
            endPicker.show(childFragmentManager, "end_picker")
        }
        startPicker.show(childFragmentManager, "start_picker")
    }

    private fun populateIfEdit() {
        editMenu?.let { menu ->
            binding.tvTitle.text = "Actualizar Menú"
            binding.btnSave.text = "ACTUALIZAR MENÚ"
            binding.etMenuName.setText(menu.name)
            binding.etMenuDesc.setText(menu.description)
            binding.switchOutsideSchedule.isChecked = menu.allowOutsideSchedule

            // Restaurar horario (schedule es Map<String, List<Map<String, String>>>)
            (menu.schedule as? Map<String, *>)?.let { scheduleMap ->
                // 1. Marcar los chips de los días
                binding.chipMon.isChecked = scheduleMap.containsKey("monday")
                binding.chipTue.isChecked = scheduleMap.containsKey("tuesday")
                binding.chipWed.isChecked = scheduleMap.containsKey("wednesday")
                binding.chipThu.isChecked = scheduleMap.containsKey("thursday")
                binding.chipFri.isChecked = scheduleMap.containsKey("friday")
                binding.chipSat.isChecked = scheduleMap.containsKey("saturday")
                binding.chipSun.isChecked = scheduleMap.containsKey("sunday")

                // 2. Cargar los rangos (tomamos el primero que encontremos ya que suelen ser iguales para todos los días seleccionados)
                val firstKey = scheduleMap.keys.firstOrNull()
                if (firstKey != null) {
                    val ranges = scheduleMap[firstKey] as? List<Map<String, String>>
                    ranges?.forEach { range ->
                        val start = range["start"]
                        val end = range["end"]
                        if (start != null && end != null) {
                            timeRanges.add(TimeRange(start, end))
                        }
                    }
                    rangesAdapter.notifyDataSetChanged()
                }
            }
        } ?: run {
            binding.tvTitle.text = "Nuevo Menú"
            binding.btnSave.text = "GUARDAR MENÚ"
        }
    }

    private fun saveMenu() {
        val name = binding.etMenuName.text.toString().trim()
        if (name.isEmpty()) {
            Toast.makeText(requireContext(), "El nombre es obligatorio", Toast.LENGTH_SHORT).show()
            return
        }

        // Construir el objeto de horario avanzado
        // { "mon": [{"start": "...", "end": "..."}], ... }
        val days = mutableMapOf<String, List<Map<String, String>>>()
        val selectedDays = getSelectedDays()
        val rangesJson = timeRanges.map { mapOf("start" to it.start, "end" to it.end) }
        
        selectedDays.forEach { day ->
            days[day] = rangesJson
        }

        val request = CreateMenuRequest(
            name = name,
            description = binding.etMenuDesc.text.toString().trim().ifEmpty { null },
            schedule = if (days.isNotEmpty()) days else null,
            allowOutsideSchedule = binding.switchOutsideSchedule.isChecked
        )

        val menu = editMenu
        if (menu != null) {
            viewModel.updateMenu(menu.id, request)
        } else {
            viewModel.createMenu(request)
        }
        dismiss()
    }

    private fun getSelectedDays(): List<String> {
        val days = mutableListOf<String>()
        if (binding.chipMon.isChecked) days.add("monday")
        if (binding.chipTue.isChecked) days.add("tuesday")
        if (binding.chipWed.isChecked) days.add("wednesday")
        if (binding.chipThu.isChecked) days.add("thursday")
        if (binding.chipFri.isChecked) days.add("friday")
        if (binding.chipSat.isChecked) days.add("saturday")
        if (binding.chipSun.isChecked) days.add("sunday")
        return days
    }

    inner class TimeRangesAdapter(
        private val list: List<TimeRange>,
        private val onDelete: (Int) -> Unit
    ) : RecyclerView.Adapter<TimeRangesAdapter.VH>() {
        
        inner class VH(val view: View) : RecyclerView.ViewHolder(view) {
            fun bind(range: TimeRange, pos: Int) {
                view.findViewById<TextView>(R.id.tvRangeText).text = "${range.start} - ${range.end}"
                view.findViewById<View>(R.id.btnDeleteRange).setOnClickListener { onDelete(pos) }
            }
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
            val v = LayoutInflater.from(parent.context).inflate(R.layout.item_time_range, parent, false)
            return VH(v)
        }

        override fun onBindViewHolder(holder: VH, position: Int) = holder.bind(list[position], position)
        override fun getItemCount() = list.size
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
