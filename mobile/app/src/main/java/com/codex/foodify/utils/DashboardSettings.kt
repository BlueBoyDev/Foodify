package com.codex.foodify.utils

import android.content.Context
import android.content.SharedPreferences

object DashboardSettings {
    private const val PREFS_NAME = "dashboard_settings"
    
    const val KEY_SHOW_GENERAL_STATS = "show_general_stats"
    const val KEY_SHOW_SALES_CHART = "show_sales_chart"
    const val KEY_SHOW_TOP_PRODUCTS = "show_top_products"
    const val KEY_SHOW_INVENTORY_ALERTS = "show_inventory_alerts"
    const val KEY_SHOW_STAFF_PERFORMANCE = "show_staff_performance"

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun saveSetting(context: Context, key: String, value: Boolean) {
        getPrefs(context).edit().putBoolean(key, value).apply()
    }

    fun getSetting(context: Context, key: String, defaultValue: Boolean = true): Boolean {
        return getPrefs(context).getBoolean(key, defaultValue)
    }
}
