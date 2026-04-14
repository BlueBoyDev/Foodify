// RUTA: app/src/main/java/com/codex/foodify/utils/StatusUtils.kt
package com.codex.foodify.utils

import android.content.res.ColorStateList
import android.graphics.Color
import com.google.android.material.chip.Chip

object StatusUtils {
    data class StatusStyle(
        val bgColorHex: String,
        val textColorHex: String,
        val label: String,
        val iconRes: Int
    )

    fun getStyle(displayStatus: String): StatusStyle = when (displayStatus) {
        "en_cocina"  -> StatusStyle("#FFF3ED", "#E8673A", "En Cocina", android.R.drawable.ic_menu_recent_history)
        "listo"      -> StatusStyle("#E8F5E9", "#4CAF50", "Listo", android.R.drawable.ic_menu_agenda)
        "pendiente"  -> StatusStyle("#E3F2FD", "#2196F3", "Pendiente", android.R.drawable.ic_menu_recent_history)
        "entregado"  -> StatusStyle("#F5F5F5", "#9E9E9E", "Entregado", android.R.drawable.ic_menu_gallery)
        "cancelado"  -> StatusStyle("#FFEBEE", "#F44336", "Cancelado", android.R.drawable.ic_menu_close_clear_cancel)
        else         -> StatusStyle("#F5F5F5", "#9E9E9E", displayStatus, android.R.drawable.ic_menu_info_details)
    }

    fun applyToChip(chip: Chip, displayStatus: String) {
        val style = getStyle(displayStatus)
        chip.chipBackgroundColor = ColorStateList.valueOf(Color.parseColor(style.bgColorHex))
        chip.setTextColor(Color.parseColor(style.textColorHex))
        chip.text = style.label
    }

    fun getBgColor(displayStatus: String): Int {
        return Color.parseColor(getStyle(displayStatus).bgColorHex)
    }

    fun getTextColor(displayStatus: String): Int {
        return Color.parseColor(getStyle(displayStatus).textColorHex)
    }
}