// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/ProfileFragment.kt
package com.codex.foodify.ui.waiter

import android.content.Intent
import android.os.Bundle
import android.view.*
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.codex.foodify.databinding.FragmentProfileBinding
import com.codex.foodify.data.model.UserRole
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.ui.waiter.WaiterViewModel
import androidx.fragment.app.activityViewModels
import com.codex.foodify.ui.login.LoginActivity
import com.codex.foodify.utils.ThemeManager
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class ProfileFragment : Fragment() {

    private var _binding: FragmentProfileBinding? = null
    private val binding get() = _binding!!

    @Inject
    lateinit var authRepository: AuthRepository

    private val viewModel: WaiterViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        loadUserData()
        setupThemeSwitch()
        setupLogout()
    }

    // ── Cargar datos del perfil desde DataStore ──────────────────────
    private fun loadUserData() {
        viewLifecycleOwner.lifecycleScope.launch {
            // Nombre
            val name = authRepository.userName.firstOrNull()
            binding.tvUserName.text = name?.ifBlank { "Sin nombre" } ?: "Sin nombre"

            // Email
            val email = authRepository.userEmail.firstOrNull()
            binding.tvUserEmail.text = email?.ifBlank { "—" } ?: "—"

            // Teléfono
            val phone = authRepository.userPhone.firstOrNull()
            binding.tvUserPhone.text = phone?.ifBlank { "—" } ?: "—"

            // Rol
            val roleRaw = authRepository.userRoleRaw.firstOrNull()
            val role = UserRole.from(roleRaw)
            binding.tvUserRole.text = role.displayNameJorge
        }
    }

    // ── Toggle Modo Oscuro ───────────────────────────────────────────
    private fun setupThemeSwitch() {
        viewLifecycleOwner.lifecycleScope.launch {
            val current = ThemeManager.load(requireContext())
            val isDark = current == ThemeManager.THEME_DARK
            binding.switchDarkMode.isChecked = isDark
            updateThemeLabel(isDark)
        }

        binding.switchDarkMode.setOnCheckedChangeListener { _, isChecked ->
            val mode = if (isChecked) ThemeManager.THEME_DARK else ThemeManager.THEME_LIGHT
            updateThemeLabel(isChecked)
            viewLifecycleOwner.lifecycleScope.launch {
                ThemeManager.save(requireContext(), mode)
                // AppCompatDelegate aplica el cambio inmediatamente sin recrear
            }
        }
    }

    private fun updateThemeLabel(isDark: Boolean) {
        binding.tvThemeStatus.text = if (isDark) "Activado" else "Desactivado"
    }

    private fun setupLogout() {
        binding.cardLogout.setOnClickListener {
            viewModel.logout {
                val intent = Intent(requireContext(), LoginActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                }
                startActivity(intent)
                requireActivity().finish()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
