package com.codex.foodify.ui.admin.tables

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.codex.foodify.data.model.Table
import com.codex.foodify.data.repository.FoodifyRepository
import com.codex.foodify.data.repository.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AdminTablesViewModel @Inject constructor(
    private val repository: FoodifyRepository
) : ViewModel() {

    private val _tables = MutableLiveData<Result<List<Table>>>()
    val tables: LiveData<Result<List<Table>>> = _tables

    private val _actionState = MutableLiveData<Result<Unit>>()
    val actionState: LiveData<Result<Unit>> = _actionState

    fun loadTables() {
        viewModelScope.launch {
            _tables.value = Result.Loading
            _tables.value = repository.getTables()
        }
    }

    fun addTable(number: Int, capacity: Int) {
        viewModelScope.launch {
            _actionState.value = Result.Loading
            val res = repository.createTable(number, capacity)
            if (res is Result.Success) {
                _actionState.value = Result.Success(Unit)
                loadTables()
            } else if (res is Result.Error) {
                _actionState.value = Result.Error(res.message)
            }
        }
    }

    fun deleteTable(id: Int) {
        viewModelScope.launch {
            _actionState.value = Result.Loading
            val res = repository.deleteTable(id)
            if (res is Result.Success) {
                _actionState.value = Result.Success(Unit)
                loadTables()
            } else if (res is Result.Error) {
                _actionState.value = Result.Error(res.message)
            }
        }
    }
}
