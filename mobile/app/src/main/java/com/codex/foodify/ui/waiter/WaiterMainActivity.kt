// RUTA: app/src/main/java/com/codex/foodify/ui/waiter/WaiterMainActivity.kt
// Panel Mesero — BottomNav: Inicio | Mesas | Pedidos | Perfil
// Solo Plan Premium — modo oscuro como en el prototipo (imagen 12 y 13)
package com.codex.foodify.ui.waiter

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.navigation.fragment.NavHostFragment
import androidx.navigation.ui.setupWithNavController
import com.codex.foodify.R
import com.codex.foodify.databinding.ActivityWaiterMainBinding
import com.codex.foodify.ui.login.LoginActivity
import com.codex.foodify.utils.WebSocketManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class WaiterMainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityWaiterMainBinding
    @Inject lateinit var webSocketManager: WebSocketManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityWaiterMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        setupNavigation()
        // Conectar WebSocket /restaurant para recibir order:ready
        webSocketManager.connectRestaurant()
    }

    private fun setupNavigation() {
        val navHost = supportFragmentManager
            .findFragmentById(R.id.nav_host_waiter) as NavHostFragment
        val navController = navHost.navController
        binding.bottomNavWaiter.setupWithNavController(navController)

        // Manejar re-selección para permitir volver al inicio desde sub-pantallas
        binding.bottomNavWaiter.setOnItemReselectedListener { item ->
            if (item.itemId == R.id.waiterHomeFragment) {
                // Si estamos en cualquier otra pantalla y presionamos Inicio, volver a la raíz del grafo
                navController.popBackStack(R.id.waiterHomeFragment, false)
            } else {
                // Para otros items, comportamiento por defecto (opcional: limpiar backstack del tab)
                navController.popBackStack(item.itemId, false)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        webSocketManager.disconnect()
    }
}
