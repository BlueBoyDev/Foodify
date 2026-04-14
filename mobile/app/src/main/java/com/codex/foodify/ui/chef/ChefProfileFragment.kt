package com.codex.foodify.ui.chef

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.codex.foodify.databinding.FragmentChefProfileBinding
import com.codex.foodify.ui.common.ThemePickerDialog
import com.codex.foodify.ui.login.LoginActivity
import com.codex.foodify.utils.ThemeManager
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import dagger.hilt.android.AndroidEntryPoint

import androidx.fragment.app.viewModels
import com.codex.foodify.data.repository.Result

@AndroidEntryPoint
class ChefProfileFragment : Fragment() {

    private var _binding: FragmentChefProfileBinding? = null
    private val binding get() = _binding!!

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentChefProfileBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        setupProfileInfo()
        setupListeners()
        observeStats()
    }

    private fun observeStats() {
        val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })
        viewModel.stats.observe(viewLifecycleOwner) { result ->
            if (result is Result.Success) {
                val stats = result.data
                binding.tvCompletedCount.text = stats.completedToday.toString()
                binding.tvAvgTime.text = if (stats.avgPrepTimeMin > 0) {
                    "${String.format("%.1f", stats.avgPrepTimeMin)}m"
                } else {
                    "0m"
                }
            }
        }
    }

    private fun setupProfileInfo() {
        // En una implementación real obtendríamos esto del UserViewModel/DataStore
        binding.tvProfileName.text = "Chef Foodify"
        binding.btnEmail.text = "chef@foodify.com"
        binding.btnRestaurant.text = "Foodify Kitchen #1"
    }

    private fun setupListeners() {
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
            }
        }

        binding.btnLogout.setOnClickListener {
            // Logout profundo
            val viewModel: KitchenViewModel by viewModels({ requireParentFragment() })
            viewModel.logout {
                val intent = Intent(requireContext(), LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                activity?.finish()
            }
        }
    }

    private fun updateThemeLabel(isDark: Boolean) {
        binding.tvThemeStatus.text = if (isDark) "Activado" else "Desactivado"
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
