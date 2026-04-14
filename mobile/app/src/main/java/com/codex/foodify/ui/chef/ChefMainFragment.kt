package com.codex.foodify.ui.chef

import android.os.Bundle
import com.codex.foodify.R
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.viewpager2.adapter.FragmentStateAdapter
import androidx.viewpager2.widget.ViewPager2
import com.codex.foodify.databinding.FragmentChefMainBinding
import com.codex.foodify.utils.ProfileUtils
import android.content.Intent
import com.codex.foodify.ui.login.LoginActivity
import com.codex.foodify.utils.WebSocketManager
import com.codex.foodify.ui.chef.fragments.KitchenHistoryFragment
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class ChefMainFragment : Fragment() {

    private var _binding: FragmentChefMainBinding? = null
    private val binding get() = _binding!!
    private val viewModel: KitchenViewModel by viewModels()

    @Inject lateinit var webSocketManager: WebSocketManager

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentChefMainBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupHeader()
        setupViewPager()
        setupWebSocketListener()
    }

    private fun setupWebSocketListener() {
        webSocketManager.onOrderFinalized { data ->
            val orderId = data?.optInt("orderId") ?: -1
            if (orderId != -1) {
                activity?.runOnUiThread {
                    viewModel.removeOrderById(orderId)
                }
            }
        }
    }

    private fun setupHeader() {
        binding.headerLayout.tvHeaderTitle.text = "Cocina"
        binding.headerLayout.tvHeaderSubtitle.text = "Gestión de pedidos y recetas"
        
        binding.headerLayout.layoutUserBadge.visibility = View.VISIBLE
        binding.headerLayout.tvRoleLabel.text = "Chef de Turno"
        
        viewModel.loggedUserName.observe(viewLifecycleOwner) { name ->
            binding.headerLayout.tvUserName.text = name ?: "Chef"
        }
        
        binding.headerLayout.btnHeaderAction.apply {
            visibility = View.VISIBLE
            setOnClickListener {
                // Logout profundo: Limpiar sesión y redirigir
                viewModel.logout {
                    val intent = Intent(requireContext(), LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    activity?.finish()
                }
            }
        }
    }

    private fun setupViewPager() {
        binding.viewPager.adapter = ChefPagerAdapter(this)
        binding.viewPager.isUserInputEnabled = false // Desactivar swipe si prefieres
        
        binding.bottomNav.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.nav_chef_orders -> binding.viewPager.currentItem = 0
                R.id.nav_chef_recipes -> binding.viewPager.currentItem = 1
                R.id.nav_chef_history -> binding.viewPager.currentItem = 2
                R.id.nav_chef_profile -> binding.viewPager.currentItem = 3
            }
            true
        }

        binding.viewPager.registerOnPageChangeCallback(object : ViewPager2.OnPageChangeCallback() {
            override fun onPageSelected(position: Int) {
                binding.bottomNav.menu.getItem(position).isChecked = true
            }
        })
    }

    private inner class ChefPagerAdapter(fragment: Fragment) : FragmentStateAdapter(fragment) {
        override fun getItemCount(): Int = 4
        override fun createFragment(position: Int): Fragment {
            return when (position) {
                0 -> KitchenOrdersFragment()
                1 -> KitchenDishesFragment()
                2 -> KitchenHistoryFragment()
                else -> ChefProfileFragment()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
