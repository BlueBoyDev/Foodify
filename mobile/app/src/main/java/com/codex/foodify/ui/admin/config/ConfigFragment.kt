package com.codex.foodify.ui.admin.config

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AppCompatDelegate
import androidx.fragment.app.Fragment
import com.codex.foodify.databinding.FragmentConfigBinding
import com.codex.foodify.ui.admin.AdminMainActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.result.PickVisualMediaRequest
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.codex.foodify.databinding.DialogChangePasswordBinding
import com.codex.foodify.utils.ThemeManager
import com.codex.foodify.utils.DashboardSettings

import kotlinx.coroutines.launch
import com.codex.foodify.R
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ConfigFragment : Fragment() {
    private var _binding: FragmentConfigBinding? = null
    private val binding get() = _binding!!

    @Inject lateinit var authRepository: AuthRepository

    private val pickMedia = registerForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        if (uri != null) {
            Glide.with(this).load(uri).circleCrop().into(binding.ivRestaurantLogo)
            Toast.makeText(requireContext(), "Logo actualizado (Sinc. con PWA)", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreateView(i: LayoutInflater, c: ViewGroup?, s: Bundle?): View {
        _binding = FragmentConfigBinding.inflate(i, c, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupRestaurantInfo()

        // Modo Oscuro - Cargar estado inicial
        lifecycleScope.launch {
            val currentTheme = ThemeManager.load(requireContext())
            binding.switchDarkMode.isChecked = (currentTheme == ThemeManager.THEME_DARK)
        }

        binding.switchDarkMode.setOnCheckedChangeListener { _, isChecked ->
            lifecycleScope.launch {
                val mode = if (isChecked) ThemeManager.THEME_DARK else ThemeManager.THEME_LIGHT
                ThemeManager.save(requireContext(), mode)
            }
        }

        setupDashboardToggles()

        // Cambio de contraseña
        binding.btnChangePassword.setOnClickListener {
            showChangePasswordDialog()
        }

        binding.btnLogout.setOnClickListener {
            (activity as? AdminMainActivity)?.logout()
        }

        // Cargar Información Personal
        viewLifecycleOwner.lifecycleScope.launchWhenStarted {
            authRepository.userName.collect { name ->
                binding.tvProfileName.text = name ?: "Usuario"
            }
        }
        viewLifecycleOwner.lifecycleScope.launchWhenStarted {
            authRepository.userEmail.collect { email ->
                binding.tvProfileEmail.text = email ?: "No disponible"
            }
        }
    }

    private fun setupDashboardToggles() {
        val ctx = requireContext()

        // Cargar estados iniciales
        binding.apply {
            switchGeneralStats.isChecked = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_GENERAL_STATS)
            switchSalesChart.isChecked = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_SALES_CHART)
            switchTopProducts.isChecked = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_TOP_PRODUCTS)
            switchInventoryAlerts.isChecked = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_INVENTORY_ALERTS)
            switchStaffPerformance.isChecked = DashboardSettings.getSetting(ctx, DashboardSettings.KEY_SHOW_STAFF_PERFORMANCE)

            // Listeners
            switchGeneralStats.setOnCheckedChangeListener { _, v -> DashboardSettings.saveSetting(ctx, DashboardSettings.KEY_SHOW_GENERAL_STATS, v) }
            switchSalesChart.setOnCheckedChangeListener { _, v -> DashboardSettings.saveSetting(ctx, DashboardSettings.KEY_SHOW_SALES_CHART, v) }
            switchTopProducts.setOnCheckedChangeListener { _, v -> DashboardSettings.saveSetting(ctx, DashboardSettings.KEY_SHOW_TOP_PRODUCTS, v) }
            switchInventoryAlerts.setOnCheckedChangeListener { _, v -> DashboardSettings.saveSetting(ctx, DashboardSettings.KEY_SHOW_INVENTORY_ALERTS, v) }
            switchStaffPerformance.setOnCheckedChangeListener { _, v -> DashboardSettings.saveSetting(ctx, DashboardSettings.KEY_SHOW_STAFF_PERFORMANCE, v) }
        }
    }

    private fun showChangePasswordDialog() {
        val dialogBinding = DialogChangePasswordBinding.inflate(LayoutInflater.from(requireContext()))
        
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Cambiar Contraseña")
            .setMessage("Para mayor seguridad, se requiere tu contraseña actual. Si no la tienes, contacta a CODEX para asistencia.")
            .setView(dialogBinding.root)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Actualizar") { _, _ ->
                val oldPass = dialogBinding.etOldPassword.text.toString()
                val newPass = dialogBinding.etNewPassword.text.toString()
                
                if (newPass.length < 6) {
                    Toast.makeText(requireContext(), "La nueva contraseña debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show()
                    return@setPositiveButton
                }

                lifecycleScope.launch {
                    val result = authRepository.changePassword(oldPass, newPass)
                    if (result is Result.Success) {
                        Toast.makeText(requireContext(), "Contraseña actualizada correctamente", Toast.LENGTH_SHORT).show()
                    } else if (result is Result.Error) {
                        MaterialAlertDialogBuilder(requireContext())
                            .setTitle("Error de Autorización")
                            .setMessage("La contraseña actual es incorrecta o no tienes permisos. Por favor solicita realizar el cambio con CODEX.")
                            .setPositiveButton("Entendido", null)
                            .show()
                    }
                }
            }
            .show()
    }

    private fun setupRestaurantInfo() {
        // Cargar datos actuales (En producción vendrían de authRepository.userProfile)
        val prefs = requireContext().getSharedPreferences("restaurant_prefs", android.content.Context.MODE_PRIVATE)
        binding.etRestaurantName.setText(prefs.getString("name", "Foodify Gourmet"))

        binding.btnChangeLogo.setOnClickListener {
            pickMedia.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
