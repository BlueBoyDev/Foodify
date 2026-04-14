package com.codex.foodify

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import com.codex.foodify.utils.ThemeManager
import com.google.firebase.FirebaseApp
import kotlinx.coroutines.runBlocking

@HiltAndroidApp
class FoodifyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)
        runBlocking {
            ThemeManager.applyTheme(ThemeManager.load(this@FoodifyApplication))
        }
    }
}
