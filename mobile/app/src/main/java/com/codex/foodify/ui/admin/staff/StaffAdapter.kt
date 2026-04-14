// RUTA: app/src/main/java/com/codex/foodify/ui/admin/staff/StaffAdapter.kt
// Card de empleado: nombre, badge de rol con color, email, teléfono, fecha creación
// Colores badge: Admin=Púrpura, Mesero=Azul, Cocina=Naranja, Cajero=Verde
package com.codex.foodify.ui.admin.staff

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.codex.foodify.R
import com.codex.foodify.data.model.Staff
import com.codex.foodify.databinding.ItemStaffBinding

class StaffAdapter(
    private val onEdit: (Staff) -> Unit,
    private val onToggle: (Staff) -> Unit,
    private val onDelete: (Staff) -> Unit,
) : ListAdapter<Staff, StaffAdapter.VH>(DiffCb()) {

    inner class VH(val b: ItemStaffBinding) : RecyclerView.ViewHolder(b.root) {
        fun bind(staff: Staff) {
            b.tvStaffName.text  = staff.displayName
            b.tvStaffEmail.text = staff.email
            b.tvStaffPhone.text = staff.displayPhone
            b.tvStaffDate.text  = "Creado: ${staff.displayDate}"
            b.tvRoleBadge.text  = staff.displayRole

            // Color del badge de rol — mapeo Jorge ↔ backend
            val roleColor = when (staff.displayRole.lowercase()) {
                "admin", "administrador" -> R.color.role_admin
                "mesero"                 -> R.color.role_waiter
                "cocina", "chef"         -> R.color.role_chef
                "cajero"                 -> R.color.role_cashier
                else                     -> R.color.text_low_light
            }
            b.tvRoleBadge.setBackgroundTintList(b.root.context.getColorStateList(roleColor))

            // Badge "Inactivo" si no está activo
            b.tvInactiveBadge.visibility =
                if (!staff.displayActive) android.view.View.VISIBLE else android.view.View.GONE

            b.btnEditStaff.setOnClickListener   { onEdit(staff) }
            b.btnDeleteStaff.setOnClickListener { onDelete(staff) }
            b.btnToggleActive.setOnClickListener { onToggle(staff) }
            b.btnToggleActive.text = if (staff.displayActive) "Desactivar" else "Activar"
        }
    }

    override fun onCreateViewHolder(p: ViewGroup, v: Int) =
        VH(ItemStaffBinding.inflate(LayoutInflater.from(p.context), p, false))

    override fun onBindViewHolder(h: VH, pos: Int) = h.bind(getItem(pos))

    class DiffCb : DiffUtil.ItemCallback<Staff>() {
        override fun areItemsTheSame(a: Staff, b: Staff) = a.id == b.id
        override fun areContentsTheSame(a: Staff, b: Staff) = a == b
    }
}
