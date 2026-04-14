package com.codex.foodify.utils

import android.content.Context
import androidx.appcompat.app.AppCompatDelegate
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "settings")

object ThemeManager {
    val THEME_LIGHT = "light"
    val THEME_DARK = "dark"
    val THEME_SYSTEM = "system"

    private val THEME_KEY = stringPreferencesKey("theme_mode")

    suspend fun save(context: Context, mode: String) {
        context.dataStore.edit { settings ->
            settings[THEME_KEY] = mode
        }
        applyTheme(mode)
    }

    suspend fun load(context: Context): String {
        return context.dataStore.data.map { settings ->
            settings[THEME_KEY] ?: THEME_SYSTEM
        }.first()
    }

    fun applyTheme(mode: String) {
        when (mode) {
            THEME_LIGHT -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
            THEME_DARK -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES)
            else -> AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        }
    }

    suspend fun initialize(context: Context) {
        val mode = load(context)
        applyTheme(mode)
    }
}
