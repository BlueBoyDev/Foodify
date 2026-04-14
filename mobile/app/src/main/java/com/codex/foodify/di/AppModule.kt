// RUTA: app/src/main/java/com/codex/foodify/di/AppModule.kt
package com.codex.foodify.di

import android.content.Context
import com.codex.foodify.utils.WebSocketManager
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    @Provides @Singleton
    fun provideWebSocketManager(@ApplicationContext ctx: Context) = WebSocketManager(ctx)
}
