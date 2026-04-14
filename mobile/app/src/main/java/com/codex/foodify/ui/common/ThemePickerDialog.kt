package com.codex.foodify.ui.common

import android.app.Dialog
import android.os.Bundle
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.lifecycleScope
import com.codex.foodify.utils.ThemeManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class ThemePickerDialog : DialogFragment() {

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        val current = runBlocking { ThemeManager.load(requireContext()) }
        val options = arrayOf("☀️  Claro", "🌙  Oscuro", "📱  Seguir sistema")
        val checkedItem = when(current) {
            ThemeManager.THEME_LIGHT  -> 0
            ThemeManager.THEME_DARK   -> 1
            else                      -> 2
        }

        return MaterialAlertDialogBuilder(requireContext())
            .setTitle("Apariencia")
            .setSingleChoiceItems(options, checkedItem) { dialog, which ->
                val mode = when (which) {
                    0 -> ThemeManager.THEME_LIGHT
                    1 -> ThemeManager.THEME_DARK
                    else -> ThemeManager.THEME_SYSTEM
                }
                lifecycleScope.launch { 
                    ThemeManager.save(requireContext(), mode) 
                }
                dialog.dismiss()
            }
            .setNegativeButton("Cancelar", null)
            .create()
    }

    companion object {
        fun show(fragmentManager: FragmentManager) =
            ThemePickerDialog().show(fragmentManager, "theme_picker")
    }
}
