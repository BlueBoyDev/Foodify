// RUTA: app/src/main/java/com/codex/foodify/data/repository/CategoryRepository.kt
package com.codex.foodify.data.repository

import com.codex.foodify.data.api.FoodifyApi
import com.codex.foodify.data.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CategoryRepository @Inject constructor(private val apiService: FoodifyApi) {

    suspend fun getCategories(menuId: Int): Result<List<Category>> {
        return try {
            val response = apiService.getCategories(menuId)
            if (response.isSuccessful) {
                Result.Success(response.body()?.data ?: emptyList())
            } else {
                Result.Error("Error ${response.code()}: ${response.message()}")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error desconocido")
        }
    }

    suspend fun createCategory(
        menuId: Int,
        request: CreateCategoryRequest
    ): Result<Category> {
        return try {
            val response = apiService.createCategoryModern(menuId, request)
            if (response.isSuccessful) {
                val category = response.body()?.data
                if (category != null) {
                    Result.Success(category)
                } else {
                    Result.Error("Respuesta vacía del servidor")
                }
            } else {
                Result.Error("Error al crear la categoría (${response.code()})")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error desconocido")
        }
    }

    suspend fun updateCategory(
        menuId: Int,
        categoryId: Int,
        request: UpdateCategoryRequest
    ): Result<Category> {
        return try {
            val response = apiService.updateCategory(menuId, categoryId, request)
            if (response.isSuccessful) {
                val category = response.body()?.data
                if (category != null) {
                    Result.Success(category)
                } else {
                    Result.Error("Respuesta vacía del servidor")
                }
            } else {
                Result.Error("Error al actualizar la categoría")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error desconocido")
        }
    }

    suspend fun updateSortOrder(
        menuId: Int,
        categoryId: Int,
        newSortOrder: Int
    ): Result<Category> {
        return try {
            val response = apiService.updateCategorySortOrder(
                menuId,
                categoryId,
                UpdateSortOrderRequest(newSortOrder)
            )
            if (response.isSuccessful) {
                val category = response.body()?.data
                if (category != null) {
                    Result.Success(category)
                } else {
                    Result.Error("Respuesta vacía del servidor")
                }
            } else {
                Result.Error("Error al reordenar")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error desconocido")
        }
    }

    suspend fun deleteCategory(menuId: Int, categoryId: Int): Result<Unit> {
        return try {
            val response = apiService.deleteCategory(menuId, categoryId)
            if (response.isSuccessful) {
                Result.Success(Unit)
            } else {
                Result.Error("Error al eliminar la categoría")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error desconocido")
        }
    }
}
