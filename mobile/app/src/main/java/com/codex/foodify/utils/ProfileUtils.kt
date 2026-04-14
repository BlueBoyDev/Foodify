package com.codex.foodify.utils

import com.codex.foodify.R

object ProfileUtils {
    /**
     * Retorna (bgColorRes, textColorRes) para el badge de rol.
     */
    fun getRoleBadgeStyle(role: String): Pair<Int, Int> {
        return when (role) {
            "restaurant_admin" -> 
                Pair(R.color.foodify_orange, R.color.text_on_primary)
            "waiter"  -> 
                Pair(R.color.status_pending_bg, R.color.status_pending_text)
            "cashier" -> 
                Pair(R.color.status_delivered_bg, R.color.status_delivered_text)
            "chef"    -> 
                Pair(R.color.foodify_orange_light, R.color.foodify_orange)
            else      -> 
                Pair(R.color.bg_surface_elevated, R.color.text_secondary)
        }
    }

    fun getRoleDisplayName(role: String): String {
        return when (role) {
            "restaurant_admin" -> "Admin"
            "waiter"  -> "Mesero"
            "cashier" -> "Cajero"
            "chef"    -> "Chef"
            else      -> role ?: "Empleado"
        }
    }
}
