// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierProfileFragment.kt
package com.codex.foodify.ui.cashier

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AlertDialog
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.lifecycle.lifecycleScope
import com.codex.foodify.R
import com.codex.foodify.databinding.FragmentCashierProfileBinding
import com.codex.foodify.ui.login.LoginActivity
import com.codex.foodify.data.api.TokenManager
import com.codex.foodify.utils.ThemeManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class CashierProfileFragment : Fragment() {

    private lateinit var binding: FragmentCashierProfileBinding
    private val viewModel: CashierViewModel by activityViewModels()

    @Inject lateinit var tokenManager: TokenManager

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        binding = FragmentCashierProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupHeader()
        setupProfile()
        observeViewModel()
        setupListeners()
    }

    private fun setupHeader() {
        binding.headerLayout.tvHeaderTitle.text = getString(R.string.app_name)
        binding.headerLayout.tvHeaderSubtitle.text = getString(R.string.cashier_panel)
        binding.headerLayout.layoutUserBadge.visibility = View.VISIBLE
        binding.headerLayout.tvRoleLabel.text = "Cajero de Turno"
        
        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.headerLayout.tvUserName.text = name ?: "Cajero"
            binding.profileFullName.text = name ?: "Cajero"
        }
    }

    private fun setupProfile() {
        // En una app real usaríamos authRepository.email, por ahora lo dejamos así
        binding.profileRole.text = getString(R.string.cashier)
        lifecycleScope.launch {
            binding.darkModeStatus.text = when (ThemeManager.load(requireContext())) {
                ThemeManager.THEME_LIGHT -> "Claro"
                ThemeManager.THEME_DARK -> "Oscuro"
                ThemeManager.THEME_SYSTEM -> "Seguir sistema"
                else -> "Desconocido"
            }
        }
    }

    private fun observeViewModel() {
        viewModel.kpis.observe(viewLifecycleOwner) { kpis ->
            binding.statsCompleted.text = kpis.completedToday.toString()
            binding.statsSales.text = String.format("$%.2f", kpis.salesToday)
        }
    }

    private fun setupListeners() {
        binding.darkModeOption.setOnClickListener {
            showThemeDialog()
        }

        binding.logoutOption.setOnClickListener {
            showLogoutConfirmDialog()
        }
    }

    private fun showThemeDialog() {
        val options = arrayOf("Claro", "Oscuro", "Seguir sistema")
        lifecycleScope.launch {
            val currentTheme = when (ThemeManager.load(requireContext())) {
                ThemeManager.THEME_LIGHT -> 0
                ThemeManager.THEME_DARK -> 1
                ThemeManager.THEME_SYSTEM -> 2
                else -> 2
            }

            AlertDialog.Builder(requireContext())
                .setTitle(getString(R.string.dark_mode))
                .setSingleChoiceItems(options, currentTheme) { dialog, which ->
                    val theme = when (which) {
                        0 -> ThemeManager.THEME_LIGHT
                        1 -> ThemeManager.THEME_DARK
                        else -> ThemeManager.THEME_SYSTEM
                    }
                    lifecycleScope.launch {
                        ThemeManager.save(requireContext(), theme)
                        ThemeManager.applyTheme(theme) // Apply theme immediately
                    }
                    dialog.dismiss()
                    binding.darkModeStatus.text = options[which]
                }
                .show()
        }
    }

    private fun showLogoutConfirmDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("¿Cerrar sesión?")
            .setMessage("¿Estás seguro de que deseas cerrar tu sesión?")
            .setPositiveButton("Sí, cerrar sesión") { _, _ ->
                logout()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun logout() {
        viewModel.logout {
            startActivity(Intent(requireContext(), LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            })
            requireActivity().finish()
        }
    }
}
