// RUTA: app/src/main/java/com/codex/foodify/ui/admin/staff/AddEditStaffDialog.kt
// Dialog: Nuevo Empleado / Editar Empleado
// Usa los nombres de campos de Jorge: nombre, apellido, email, telefono, rol, contrasena
package com.codex.foodify.ui.admin.staff

import android.os.Bundle
import android.view.*
import android.widget.ArrayAdapter
import androidx.fragment.app.activityViewModels
import com.codex.foodify.data.model.CreateStaffRequest
import com.codex.foodify.data.model.Staff
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.DialogAddEditStaffBinding
import com.google.android.material.bottomsheet.BottomSheetDialogFragment
import com.google.gson.Gson

class AddEditStaffDialog : BottomSheetDialogFragment() {

    private var _binding: DialogAddEditStaffBinding? = null
    private val binding get() = _binding!!
    private val viewModel: StaffViewModel by activityViewModels()
    private var editStaff: Staff? = null

    // Roles en formato de Jorge
    private val roles = listOf("Admin", "Mesero", "Cocina", "Cajero")

    companion object {
        fun newInstance(staff: Staff?) = AddEditStaffDialog().apply {
            arguments = Bundle().apply {
                if (staff != null) putString("staff", Gson().toJson(staff))
            }
        }
    }

    override fun onCreate(s: Bundle?) {
        super.onCreate(s)
        editStaff = arguments?.getString("staff")?.let {
            Gson().fromJson(it, Staff::class.java)
        }
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = DialogAddEditStaffBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        viewModel.resetActionState()

        binding.tvTitle.text = if (editStaff != null) "Editar Empleado" else "Nuevo Empleado"

        // Spinner de roles (formato Jorge)
        val adapter = ArrayAdapter(
            requireContext(),
            android.R.layout.simple_spinner_item,
            roles,
        ).also { it.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item) }
        binding.spinnerRol.adapter = adapter

        // Pre-llenar en modo edición
        editStaff?.let { s ->
            val (nombre, apellido) = splitName(s.displayName)
            binding.etNombre.setText(nombre)
            binding.etApellido.setText(apellido)
            binding.etEmail.setText(s.email)
            binding.etTelefono.setText(s.displayPhone)
            // Seleccionar rol
            val jorgeRole = s.rol ?: mapToJorgeRole(s.role ?: "")
            binding.spinnerRol.setSelection(roles.indexOf(jorgeRole).coerceAtLeast(0))
            // Contraseña no se pre-llena
            binding.tilContrasena.hint = "Nueva contraseña (dejar vacío para no cambiar)"
        }

        binding.btnSave.setOnClickListener { save() }
        binding.btnCancel.setOnClickListener { dismiss() }

        viewModel.actionState.observe(viewLifecycleOwner) { result ->
            result ?: return@observe
            when (result) {
                is Result.Loading -> binding.btnSave.isEnabled = false
                is Result.Success -> dismiss()
                is Result.Error   -> {
                    binding.btnSave.isEnabled = true
                    binding.tilNombre.error = result.message
                }
                else -> {
                    binding.btnSave.isEnabled = true
                }
            }
        }
    }

    private fun save() {
        // Limpiar errores previos
        binding.tilNombre.error = null
        binding.tilEmail.error = null
        binding.tilContrasena.error = null

        val nombre    = binding.etNombre.text.toString().trim()
        val apellido  = binding.etApellido.text.toString().trim()
        val email     = binding.etEmail.text.toString().trim()
        val telefono  = binding.etTelefono.text.toString().trim().ifEmpty { null }
        val rol       = roles[binding.spinnerRol.selectedItemPosition]
        val contrasena = binding.etContrasena.text.toString()

        if (nombre.isEmpty())    { binding.tilNombre.error    = "Nombre requerido";    return }
        if (email.isEmpty())     { binding.tilEmail.error     = "Email requerido";     return }
        if (editStaff == null && contrasena.length < 6) {
            binding.tilContrasena.error = "Mínimo 6 caracteres"; return
        }

        if (editStaff == null) {
            val fullName = "$nombre $apellido".trim()
            val backendRole = mapToBackendRole(rol)
            viewModel.createStaff(
                CreateStaffRequest(fullName, email, contrasena, backendRole, telefono)
            )
        } else {
            val updates = mutableMapOf<String, Any>()
            updates["fullName"] = "$nombre $apellido".trim()
            updates["email"] = email
            updates["role"]  = mapToBackendRole(rol)
            if (telefono != null) updates["phone"] = telefono
            if (contrasena.length >= 6) updates["password"] = contrasena
            viewModel.updateStaff(editStaff!!.id, updates)
        }
    }

    private fun splitName(fullName: String): Pair<String, String> {
        val parts = fullName.trim().split(" ")
        return Pair(parts.firstOrNull() ?: "", parts.drop(1).joinToString(" "))
    }

    private fun mapToBackendRole(jorgeRole: String) = when (jorgeRole) {
        "Admin"  -> "restaurant_admin"
        "Mesero" -> "waiter"
        "Cocina" -> "chef"
        "Cajero" -> "cashier"
        else     -> "waiter"
    }

    private fun mapToJorgeRole(backendRole: String) = when (backendRole) {
        "restaurant_admin" -> "Admin"
        "waiter"           -> "Mesero"
        "chef"             -> "Cocina"
        "cashier"          -> "Cajero"
        else               -> "Mesero"
    }

    override fun onDestroyView() { super.onDestroyView(); _binding = null }
}
