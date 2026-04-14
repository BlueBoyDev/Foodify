// RUTA: app/src/main/java/com/codex/foodify/ui/login/LoginViewModel.kt
package com.codex.foodify.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.repository.AuthRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _loginState = MutableLiveData<Result<String>>()
    val loginState: LiveData<Result<String>> = _loginState

    fun login(email: String, password: String) {
        _loginState.value = Result.Loading
        viewModelScope.launch {
            val result = authRepository.login(email, password)
            _loginState.value = when (result) {
                is Result.Success -> Result.Success(result.data.role)
                is Result.Error   -> Result.Error(result.message, result.code)
                else              -> Result.Error("Error desconocido")
            }
        }
    }

    fun checkAutoLogin() {
        viewModelScope.launch {
            val token = authRepository.accessToken.firstOrNull()
            val role  = authRepository.userRoleRaw.firstOrNull()
            if (!token.isNullOrEmpty() && !role.isNullOrEmpty()) {
                _loginState.value = Result.Success(role)
            }
        }
    }

    fun updateFcmToken(token: String) {
        viewModelScope.launch {
            authRepository.updateFcmToken(token)
        }
    }
}
