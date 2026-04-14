# 🍽️ Foodify - Guía Maestra de Configuración y Desarrollo

Bienvenido al ecosistema **Foodify**. Este documento centraliza las instrucciones necesarias para clonar, configurar y ejecutar tanto la **App Móvil (Android)** como el **Servidor (Backend)** desde cero.

---

## 🏗️ Arquitectura del Sistema
Foodify es una plataforma SaaS compuesta por:
1.  **Backend (NestJS):** Cerebro central que gestiona la base de datos MySQL, caché Redis y WebSockets para cocina.
2.  **App Móvil (Kotlin):** Herramienta operativa para administradores, meseros, chefs y cajeros.
3.  **PWA (Next.js):** Interfaz para el administrador del SaaS y menú digital para comensales.

---

## 🛠️ Requisitos del Entorno

### General
-   **Git:** Para clonar los repositorios. [Descargar](https://git-scm.com/downloads)

### Para el Backend
-   **Node.js:** Versión 20 (LTS). [Descargar](https://nodejs.org/)
-   **Docker Desktop:** Para levantar MySQL y Redis sin configuraciones manuales. [Descargar](https://www.docker.com/products/docker-desktop/)

### Para Android
-   **JDK 21:** Necesario para compilar el proyecto Gradle. [Descargar Temurin JDK 21](https://adoptium.net/temurin/releases/?version=21)
-   **Android Studio:** Recomendado "Ladybug" o superior.

---

## 📂 Clonación de Repositorios

Abre una terminal y ejecuta:

```bash
# 1. Clonar el Backend
git clone https://github.com/alexmunoz1096/foodify-backend.git

# 2. Clonar la App Móvil
git clone https://github.com/alexmunoz1096/foodify-android.git
```

---

## 🚀 Configuración del Backend

1.  **Entrar a la carpeta:** `cd foodify-backend`
2.  **Configurar variables:** Copia el archivo `.env.example` a `.env`.
3.  **Encender Bases de Datos (Docker):**
    ```bash
    docker compose up -d
    ```
4.  **Instalar y Ejecutar (Local):**
    ```bash
    npm install
    npm run start:dev
    ```
    *El servidor estará disponible en `http://localhost:3000`.*

---

## 📱 Configuración de la App Android

1.  **Abrir en Android Studio:** Selecciona la carpeta `foodify-android`.
2.  **Sincronizar Gradle:** Deja que el IDE descargue las dependencias.
3.  **Generar APK desde Terminal:**
    Si tienes configurado `JAVA_HOME` apuntando a JDK 21, puedes generar el APK rápidamente:
    ```powershell
    # En Windows (PowerShell)
    ./gradlew assembleDebug
    ```
    El archivo resultante estará en:
    `app/build/outputs/apk/debug/app-debug.apk`

---

## 📝 Notas de Desarrollo

### Roles de Usuario de Prueba
| Usuario | Password | Rol |
| :--- | :--- | :--- |
| `admin@demo.foodify.mx` | `Demo2026!` | Administrador |
| `waiter@demo.foodify.mx` | `Demo2026!` | Mesero |
| `chef@demo.foodify.mx` | `Demo2026!` | Chef |

### Reglas de Negocio Implementadas (v3.2)
-   **Aislamiento de Meseros:** Cada mesero solo visualiza sus propias mesas y pedidos activos.
-   **Propiedad de Cocina:** Al iniciar una comanda, esta se asigna al chef que la tomó, impidiendo interferencias.
-   **Inventario FIFO:** Los insumos se descuentan automáticamente de los lotes más antiguos al finalizar platillos.

---
© 2026 Foodify - Codex Group. Todos los derechos reservados.
