// RUTA: app/src/main/java/com/codex/foodify/ui/admin/AdminMainActivity.kt
package com.codex.foodify.ui.admin

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.codex.foodify.R
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.databinding.ActivityAdminMainBinding
import com.codex.foodify.ui.login.LoginActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class AdminMainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminMainBinding
    private lateinit var navController: NavController
    
    @Inject lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Inicializar tema antes de inflating o justo después
        lifecycleScope.launch {
            com.codex.foodify.utils.ThemeManager.initialize(this@AdminMainActivity)
        }

        binding = ActivityAdminMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupNavigation()
    }

    private fun setupNavigation() {
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.nav_host_fragment_admin) as NavHostFragment
        navController = navHostFragment.navController
        binding.bottomNavAdmin.setupWithNavController(navController)
    }

    /** 
     * Logout REAL: Borra los datos del repositorio y luego redirige al login.
     */
    fun logout() {
        lifecycleScope.launch {
            authRepository.logout() // Borra tokens de DataStore y SharedPreferences
            
            val intent = Intent(this@AdminMainActivity, LoginActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            startActivity(intent)
            finish()
        }
    }
}
