package com.codex.foodify.ui.chef

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.codex.foodify.R
import com.codex.foodify.utils.WebSocketManager
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject
import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.util.Log
import com.google.android.material.snackbar.Snackbar

@AndroidEntryPoint
class ChefMainActivity : AppCompatActivity() {
    @Inject lateinit var webSocketManager: WebSocketManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_chef_main)

        setupWebSockets()

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.chef_container, ChefMainFragment())
                .commit()
        }
    }

    private fun setupWebSockets() {
        webSocketManager.connectKitchen()
        
        webSocketManager.onOrderNew { data ->
            runOnUiThread {
                notifyNewOrder()
                // El ViewModel se actualizará por polling o podemos emitir un evento local
                // Aquí usamos Snackbar para feedback visual inmediato
                Snackbar.make(findViewById(R.id.chef_container), 
                    "¡Nuevo pedido recibido!", Snackbar.LENGTH_LONG)
                    .setBackgroundTint(getColor(R.color.foodify_orange))
                    .show()
            }
        }
    }

    private fun notifyNewOrder() {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(500, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            vibrator.vibrate(500)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        webSocketManager.disconnect()
    }
}
