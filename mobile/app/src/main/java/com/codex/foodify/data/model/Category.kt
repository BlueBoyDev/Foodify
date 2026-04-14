// RUTA: app/src/main/java/com/codex/foodify/data/model/Category.kt
package com.codex.foodify.data.model

import com.google.gson.annotations.SerializedName

data class Category(
    val id: Int,
    @SerializedName("menu_id") val menuId: Int,
    val name: String,
    val description: String?,
    val icon: String?,
    val schedule: CategorySchedule?,
    @SerializedName("sort_order") val sortOrder: Int,
    @SerializedName("is_active") val isActive: Boolean
)

data class CategorySchedule(
    val start: String,   // formato "HH:MM"
    val end: String      // formato "HH:MM"
)

data class CreateCategoryRequest(
    val name: String,
    val description: String?,
    @SerializedName("sort_order") val sortOrder: Int,
    val schedule: CategorySchedule?,
    val icon: String?,
    @SerializedName("is_active") val isActive: Boolean
)

typealias UpdateCategoryRequest = CreateCategoryRequest

data class UpdateSortOrderRequest(
    @SerializedName("sort_order") val sortOrder: Int
)

// Estado de UI para la lista
sealed class CategoriesUiState {
    object Loading : CategoriesUiState()
    data class Success(val categories: List<Category>) : CategoriesUiState()
    data class Error(val message: String) : CategoriesUiState()
    object Empty : CategoriesUiState()
}

// Estado de UI para operaciones (crear, editar, eliminar)
sealed class CategoryOperationState {
    object Idle : CategoryOperationState()
    object Loading : CategoryOperationState()
    object Success : CategoryOperationState()
    data class Error(val message: String) : CategoryOperationState()
}
