// RUTA: app/src/main/java/com/codex/foodify/ui/cashier/CashierMainActivity.kt
// Panel Cajero — Solo Plan Premium
package com.codex.foodify.ui.cashier

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.NavController
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.codex.foodify.R
import com.codex.foodify.databinding.ActivityCashierMainBinding
import com.codex.foodify.utils.WebSocketManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class CashierMainActivity : AppCompatActivity() {
    @Inject lateinit var webSocketManager: WebSocketManager
    
    private lateinit var binding: ActivityCashierMainBinding
    private lateinit var navController: NavController

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCashierMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Setup Navigation
        val navHostFragment = supportFragmentManager
            .findFragmentById(R.id.navHostCashier) as NavHostFragment
        navController = navHostFragment.navController

        // Conectar BottomNavigationView con NavController
        binding.cashierBottomNav.setupWithNavController(navController)

        // WebSocket
        webSocketManager.connectRestaurant()
    }

    override fun onDestroy() {
        super.onDestroy()
        webSocketManager.disconnect()
    }
}
