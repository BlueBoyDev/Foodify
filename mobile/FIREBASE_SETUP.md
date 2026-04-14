# Guía de Configuración de Firebase Cloud Messaging (FCM)

He integrado las bases de Firebase en el proyecto. Sin embargo, para que las notificaciones funcionen, debes completar la configuración manual en la Consola de Firebase. Sigue estos pasos:

## Fase 1: Configuración en la Consola de Firebase

1.  Ve a [Firebase Console](https://console.firebase.google.com/).
2.  Crea un nuevo proyecto llamado `Foodify`.
3.  Agrega una aplicación **Android** al proyecto:
    - **Nombre del paquete**: `com.codex.foodify` (debe coincidir exactamente con el `applicationId` en `build.gradle`).
    - **Apodo**: `Foodify App`.
    - **Certificado SHA-1**: Puedes obtenerlo ejecutando `./gradlew signingReport` en la terminal del proyecto. Copia el SHA-1 de la variante `debug`.
4.  Descarga el archivo **`google-services.json`**.
5.  Copia ese archivo en la carpeta `app/` de este proyecto (ruta: `foodify-android/app/google-services.json`).

## Fase 2: Activación del Plugin en el Código

Una vez que hayas colocado el archivo `google-services.json`, debes activar el plugin que actualmente dejé desactivado para evitar errores de compilación:

### 1. build.gradle (Proyecto)
Abre `foodify-android/build.gradle` (el de la raíz) y agrega esta línea en el bloque `dependencies` si no existe:
```gradle
dependencies {
    // ... otras dependencias
    classpath 'com.google.gms:google-services:4.4.0'
}
```

### 2. build.gradle (App)
Abre `foodify-android/app/build.gradle` y agrega el plugin al principio del archivo:
```gradle
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    // ... otros plugins
    id 'com.google.gms.google-services' // <--- AGREGA ESTA LÍNEA
}
```

## Fase 3: Registro del Servicio
Asegúrate de que el servicio esté registrado en el `AndroidManifest.xml`. Yo ya lo he preparado conceptualmente, pero verifica que aparezca así dentro del bloque `<application>`:

```xml
<service
    android:name=".utils.FoodifyMessagingService"
    android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
</service>
```

## ¿Cómo funciona lo que implementé?

1.  **Captura de Token**: Cada vez que un usuario inicia sesión, la App obtiene su token único de Firebase y lo envía al servidor (`POST /api/v1/auth/fcm-token`).
2.  **Sincronización**: El backend guarda este token en la tabla de usuarios.
3.  **Envío (Backend)**: Para que las notificaciones lleguen "de verdad", deberás configurar el `Firebase Admin SDK` en tu servidor de Node.js usando una **Cuenta de Servicio** que puedes descargar desde la sección "Project Settings" -> "Service Accounts" de Firebase.

### Notas adicionales:
*   Las notificaciones configuradas actualmente se muestran en un canal llamado **"Notificaciones de Pedidos"**.
*   Al pulsar la notificación, el usuario es redirigido a la pantalla de Login para revalidar su sesión.
