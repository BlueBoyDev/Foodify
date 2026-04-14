// RUTA: app/src/main/java/com/codex/foodify/data/repository/AuthRepository.kt
package com.codex.foodify.data.repository

import android.content.Context
import android.util.Base64
import androidx.datastore.preferences.core.edit
import com.codex.foodify.data.api.ACCESS_TOKEN_KEY
import com.codex.foodify.data.api.PLAN_NAME_KEY
import com.codex.foodify.data.api.REFRESH_TOKEN_KEY
import com.codex.foodify.data.api.RESTAURANT_ID_KEY
import com.codex.foodify.data.api.USER_ROLE_KEY
import com.codex.foodify.data.api.USER_NAME_KEY
import com.codex.foodify.data.api.USER_EMAIL_KEY
import com.codex.foodify.data.api.USER_PHONE_KEY
import com.codex.foodify.data.api.TokenManager
import com.codex.foodify.data.api.FoodifyApi
import com.codex.foodify.data.api.dataStore
import com.codex.foodify.data.model.LoginRequest
import com.codex.foodify.data.model.LoginResponse
import com.codex.foodify.data.model.UserRole
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String, val code: Int = 0) : Result<Nothing>()
    object Loading : Result<Nothing>()
    object Idle : Result<Nothing>()

    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }

    inline fun onFailure(action: (Error) -> Unit): Result<T> {
        if (this is Error) action(this)
        return this
    }
}

@Singleton
class AuthRepository @Inject constructor(
    private val api: FoodifyApi,
    private val tokenManager: TokenManager,
    @ApplicationContext private val context: Context,
) {

    val accessToken: Flow<String?> = context.dataStore.data.map { it[ACCESS_TOKEN_KEY] }
    val userRoleRaw: Flow<String?> = context.dataStore.data.map { it[USER_ROLE_KEY] }
    val planName: Flow<String?> = context.dataStore.data.map { it[PLAN_NAME_KEY] }
    val restaurantId: Flow<Int?> = context.dataStore.data.map { it[RESTAURANT_ID_KEY]?.toIntOrNull() }
    val isLoggedIn: Flow<Boolean> = context.dataStore.data.map { !it[ACCESS_TOKEN_KEY].isNullOrEmpty() }

    val userName: Flow<String?> =
        context.dataStore.data.map { prefs ->
            val storedName = prefs[USER_NAME_KEY]
            if (storedName.isNullOrBlank()) {
                val email = prefs[USER_EMAIL_KEY] ?: ""
                email.split("@").firstOrNull()?.replaceFirstChar { it.uppercase() }
            } else {
                storedName
            }
        }

    val userEmail: Flow<String?> =
        context.dataStore.data.map { it[USER_EMAIL_KEY]?.ifBlank { null } }

    val userPhone: Flow<String?> =
        context.dataStore.data.map { it[USER_PHONE_KEY]?.ifBlank { null } }
    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            val apiResponse = response.body()
            if (response.isSuccessful && apiResponse?.data != null) {
                saveSession(apiResponse.data)
                Result.Success(apiResponse.data)
            } else {
                Result.Error("Credenciales inválidas", response.code())
            }
        } catch (e: Exception) {
            Result.Error("Sin conexión al servidor")
        }
    }

    suspend fun saveSession(response: LoginResponse) {
        // 1. Guardar en TokenManager (Síncrono para el OkHttp Interceptor)
        tokenManager.saveAccessToken(response.accessToken)

        // 2. Guardar en DataStore (Asíncrono para la UI)
        // Extraer restaurantId del JWT si viene nulo en la respuesta
        val rId = response.restaurantId ?: decodeRestaurantId(response.accessToken)
        val jwtPayload = decodeJwtPayload(response.accessToken)
        context.dataStore.edit { prefs ->
            prefs[ACCESS_TOKEN_KEY]  = response.accessToken
            prefs[REFRESH_TOKEN_KEY] = response.refreshToken
            prefs[USER_ROLE_KEY]     = response.role
            prefs[PLAN_NAME_KEY]     = response.planName
            prefs[RESTAURANT_ID_KEY] = rId?.toString() ?: ""
            // Guardar datos de perfil desde el JWT
            val email = jwtPayload?.optString("email", "") ?: ""
            val name = jwtPayload?.optString("fullName", "")?.ifBlank { null }
                ?: jwtPayload?.optString("name", "")?.ifBlank { null }
                ?: email.split("@").firstOrNull()?.replaceFirstChar { it.uppercase() }
                ?: "Usuario"

            prefs[USER_NAME_KEY]  = name
            prefs[USER_EMAIL_KEY] = email
            prefs[USER_PHONE_KEY] = jwtPayload?.optString("phone", "")
                ?: jwtPayload?.optString("telefono", "") ?: ""
        }
    }

    /** Decodifica el restaurantId desde el JWT payload */
    private fun decodeRestaurantId(token: String): Int? {
        return try {
            val json = decodeJwtPayload(token) ?: return null
            if (json.has("restaurantId")) json.getInt("restaurantId") else null
        } catch (e: Exception) { null }
    }

    /** Decodifica el payload completo del JWT como JSONObject */
    private fun decodeJwtPayload(token: String): JSONObject? {
        return try {
            val parts = token.split(".")
            if (parts.size < 2) return null
            val payload = String(Base64.decode(parts[1], Base64.URL_SAFE))
            JSONObject(payload)
        } catch (e: Exception) { null }
    }

    /** 
     * Logout REAL: Borra los tokens de TODOS los sitios para que el Auto-Login no rebote
     */
    suspend fun logout() {
        try { api.logout() } catch (_: Exception) {}
        tokenManager.clear() // Borra SharedPreferences
        context.dataStore.edit { it.clear() } // Borra DataStore
    }

    fun getUserRole(): Flow<UserRole> = userRoleRaw.map { r -> UserRole.from(r ?: "restaurant_admin") }
    fun isPremium(): Flow<Boolean> = planName.map { plan -> plan?.lowercase()?.contains("premium") == true }

    suspend fun changePassword(oldPass: String, newPass: String): Result<Unit> {
        return try {
            val token = accessToken.firstOrNull() ?: return Result.Error("No hay sesión activa")
            val userId = decodeJwtPayload(token)?.optInt("id") ?: return Result.Error("No se pudo identificar al usuario")
            
            // Usamos el endpoint genérico de actualización de usuario para Admin
            val body = mapOf("password" to newPass)
            val response = api.updateUser(userId, body)
            
            if (response.isSuccessful) {
                Result.Success(Unit)
            } else {
                Result.Error("Error al actualizar contraseña. Verifica tus permisos.")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.message}")
        }
    }
    suspend fun updateFcmToken(fcmToken: String): Result<Unit> {
        return try {
            val response = api.updateFcmToken(mapOf("fcmToken" to fcmToken))
            if (response.isSuccessful) {
                Result.Success(Unit)
            } else {
                Result.Error("Error al sincronizar token de notificaciones")
            }
        } catch (e: Exception) {
            Result.Error("Falla de red al sincronizar notificaciones")
        }
    }
}