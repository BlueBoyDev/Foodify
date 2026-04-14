// RUTA: app/src/main/java/com/codex/foodify/ui/login/LoginActivity.kt
// Pantalla de Login — modo claro/oscuro, fondo beige #FFF8F0
// Muestra credenciales de prueba como en el prototipo
package com.codex.foodify.ui.login

import android.content.Intent
import android.os.Bundle
import android.view.View
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.lifecycleScope
import com.codex.foodify.R
import com.codex.foodify.data.model.UserRole
import com.codex.foodify.data.repository.Result
import com.codex.foodify.databinding.ActivityLoginBinding
import com.codex.foodify.ui.admin.AdminMainActivity
import com.codex.foodify.ui.waiter.WaiterMainActivity
import com.codex.foodify.ui.chef.ChefMainActivity
import com.codex.foodify.ui.cashier.CashierMainActivity
import com.google.android.material.snackbar.Snackbar
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        observeViewModel()
        checkAutoLogin()
    }

    private fun checkAutoLogin() {
        lifecycleScope.launch {
            viewModel.checkAutoLogin()
        }
    }

    private fun setupUI() {
        binding.apply {
            // Validación en tiempo real del email
            etEmail.addTextChangedListener { s ->
                tilEmail.error = null
                btnLogin.isEnabled = (s?.isNotEmpty() == true) && (etPassword.text?.isNotEmpty() == true)
            }
            etPassword.addTextChangedListener { s ->
                tilPassword.error = null
                btnLogin.isEnabled = (etEmail.text?.isNotEmpty() == true) && (s?.isNotEmpty() == true)
            }

            btnLogin.setOnClickListener {
                val email    = etEmail.text.toString().trim()
                val password = etPassword.text.toString()

                if (email.isEmpty()) { tilEmail.error = "Ingresa tu correo"; return@setOnClickListener }
                if (password.isEmpty()) { tilPassword.error = "Ingresa tu contraseña"; return@setOnClickListener }

                viewModel.login(email, password)
            }
        }
    }

    private fun observeViewModel() {
        viewModel.loginState.observe(this) { result ->
            when (result) {
                is Result.Loading -> setLoadingState(true)
                is Result.Success -> {
                    setLoadingState(false)
                    syncFcmTokenAndNavigate(result.data)
                }
                is Result.Error -> {
                    setLoadingState(false)
                    Snackbar.make(binding.root, result.message, Snackbar.LENGTH_LONG)
                        .setBackgroundTint(getColor(R.color.order_cancelled))
                        .show()
                }
                else -> {
                    setLoadingState(false)
                }
            }
        }
    }

    private fun setLoadingState(loading: Boolean) {
        binding.btnLogin.isEnabled = !loading
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnLogin.text = if (loading) "" else getString(R.string.login_button)
    }

    private fun syncFcmTokenAndNavigate(role: String) {
        android.util.Log.d("LoginActivity", "Login exitoso. Iniciando navegación para rol: $role")
        
        // 1. Navegamos inmediatamente para no bloquear la UI
        navigateToRole(role)

        // 2. Intentamos sincronizar el token en segundo plano con manejo de errores robusto
        try {
            if (FirebaseApp.getApps(this).isNotEmpty()) {
                FirebaseMessaging.getInstance().token
                    .addOnCompleteListener { task ->
                        if (task.isSuccessful) {
                            val token = task.result
                            lifecycleScope.launch {
                                viewModel.updateFcmToken(token)
                                android.util.Log.d("LoginActivity", "FCM Token sincronizado con éxito.")
                            }
                        } else {
                            // Error controlado: Probablemente un problema de red en el emulador
                            android.util.Log.w("LoginActivity", "No se pudo obtener el token de FCM: ${task.exception?.message}")
                        }
                    }
                    .addOnFailureListener { e ->
                        // Captura fallos de Firebase Installations sin ensuciar el log
                        android.util.Log.w("LoginActivity", "Fallo en el servicio de Firebase: ${e.message}")
                    }
            }
        } catch (e: Exception) {
            android.util.Log.e("LoginActivity", "Excepción al inicializar Firebase Messaging: ${e.message}")
        }
    }

    private fun navigateToRole(role: String) {
        android.util.Log.d("LoginActivity", "Ejecutando navegación para: $role")
        val userRole = UserRole.from(role)
        val intent = when (userRole) {
            UserRole.RESTAURANT_ADMIN -> Intent(this, AdminMainActivity::class.java)
            UserRole.WAITER           -> Intent(this, WaiterMainActivity::class.java)
            UserRole.CHEF             -> Intent(this, ChefMainActivity::class.java)
            UserRole.CASHIER          -> Intent(this, CashierMainActivity::class.java)
            UserRole.SAAS_ADMIN       -> Intent(this, AdminMainActivity::class.java)
        }
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
        finish() // Cerramos login para evitar volver atrás
    }
}
