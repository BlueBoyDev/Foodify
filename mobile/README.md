# Foodify Android v3.2 📱

Foodify es un ecosistema integral de gestión para restaurantes diseñado para optimizar la comunicación entre el salón, la cocina y la administración. Esta aplicación Android es el núcleo operativo para el personal del establecimiento, integrando funciones avanzadas de Punto de Venta (POS), Sistema de Pantalla de Cocina (KDS) y Gestión de Inventarios.

## 📌 Contexto del Sistema

El sistema Foodify opera bajo una arquitectura de múltiples roles, donde cada miembro del staff accede a una interfaz optimizada para sus tareas específicas. La aplicación móvil se sincroniza en tiempo real con un backend centralizado y una PWA (Progressive Web App), garantizando que la información de pedidos, stock y mesas sea consistente en todo momento.

---

## 🛠️ Stack Tecnológico

- **Lenguaje:** Kotlin + Coroutines & Flow (Concurrencia moderna).
- **Arquitectura:** MVVM (Model-View-ViewModel) + Clean Architecture.
- **Inyección de Dependencias:** Hilt (Dagger).
- **Redes:** Retrofit 2 + OkHttp 4 (Comunicación RESTful).
- **Navegación:** Jetpack Navigation Component (Arquitectura de Single Activity por Rol).
- **Persistencia:** DataStore (Preferencias de usuario y sesión).
- **UI:** ViewBinding, Material Components, Dynamic Themes (ThemeManager).
- **Gráficas:** MPAndroidChart (Dashboard analítico).
- **Escaneo:** ZXing (Gestión de pedidos por QR).

---

## 🧩 Módulos Funcionales

### 1. Panel de Administración (Admin)
Módulo central para la toma de decisiones y control total del restaurante.
- **Dashboard Analítico:** Visualización de KPIs (Ventas del mes, pedidos del día, valor del inventario) y gráficas de ventas semanales.
- **Gestión de Personal (Staff):** Alta, baja (desactivación) y edición de empleados. Control de roles y permisos.
- **Inventario Inteligente:** Gestión de insumos por lotes (FIFO). Seguimiento de stock crítico y alertas de caducidad.
- **Configuración de Menú:** Creación de categorías y platillos, asignación de precios, descripción e imágenes.

### 2. Módulo de Meseros (Waiter)
Optimizado para la movilidad y la rapidez en el servicio.
- **Gestión de Mesas:** Mapa interactivo de mesas con estados (Libre, Ocupada, Reservada, Limpieza).
- **Toma de Pedidos:** Menú digital categorizado para levantar órdenes rápidamente, con soporte para notas especiales.
- **Seguimiento:** Consulta del estatus de los pedidos asignados en tiempo real.

### 3. Módulo de Cocina (Chef / KDS)
Sistema de Pantallas de Cocina para eliminar el uso de comandas de papel.
- **Gestión de Órdenes:** Visualización de pedidos pendientes con temporizadores de urgencia y niveles de prioridad.
- **Recetario Digital:** Consulta de pasos de preparación e ingredientes requeridos por platillo.
- **Control de Salida:** Marcación de platillos como "En preparación" o "Listos para entrega".
- **Integración con Inventario:** Deducción automática de insumos (FIFO) al marcar un platillo como finalizado.

### 4. Módulo de Caja (Cashier)
Foco en la velocidad de cobro y precisión financiera.
- **Validación QR:** Lectura de códigos QR de comandas para recuperación instantánea de cuentas.
- **Procesamiento de Pagos:** Registro de cierres de órdenes y generación de comprobantes.
- **Historial de Ventas:** Consulta detallada de órdenes finalizadas y canceladas.

---

## 🏗️ Modelos de Datos (Entities)

La lógica de negocio se apoya en los siguientes modelos principales localizados en `data/model/Models.kt`:

- **`Dish`:** Representa un platillo del menú. Incluye precio, tiempo estimado de preparación, margen de utilidad y disponibilidad.
- **`Order` / `OrderItem`:** Maneja el ciclo de vida del pedido. Atiende estados como `pending`, `preparing`, `ready` y `delivered`.
- **`InventoryItem` / `InventoryLot`:** Estructura para el control de stock. Soporta múltiples lotes para un mismo insumo con diferentes fechas de entrada/caducidad.
- **`Recipe`:** Define la composición de un platillo, vinculando insumos del inventario con cantidades específicas.
- **`Staff`:** Gestiona la identidad y el rol del usuario (`RESTAURANT_ADMIN`, `WAITER`, `CHEF`, `CASHIER`).

---

## 🔄 Flujos Críticos del Sistema

A continuación se detallan los flujos de trabajo que conectan los diferentes módulos para garantizar una operación fluida:

### 1. Flujo de Atención y Venta (Meseros)
1.  **Selección de Mesa:** El mesero visualiza el mapa de mesas y selecciona una mesa disponible (`Libre`).
2.  **Toma de Comanda:** Navega por el menú digital y añade platillos al carrito. Se pueden añadir notas especiales (ej. "Sin cebolla").
3.  **Envío a Cocina:** Al confirmar la orden, esta se envía instantáneamente al KDS de la cocina y se notifica al chef. El estado de la mesa cambia a `Ocupada`.

### 2. Flujo de Producción y KDS (Cocina)
1.  **Recepción de Orden:** El chef recibe el ticket digital en pantalla. El tiempo de espera comienza a correr.
2.  **Preparación:** El chef puede consultar la receta detallada si es necesario. Inicia la preparación marcando la orden.
3.  **Finalización:** Al terminar, el chef marca el platillo como `Listo`. 
    *   **Acción Automática:** En este punto, el sistema deduce automáticamente los insumos del inventario utilizando la lógica **FIFO** (First-In, First-Out), consumiendo los lotes más antiguos primero.
4.  **Notificación:** El mesero recibe una alerta de que el pedido está listo para ser servido.

### 3. Flujo de Cobro (Cajero)
1.  **Solicitud de Cuenta:** El comensal solicita su cuenta. El mesero o cajero puede generar/mostrar el QR de la orden.
2.  **Escaneo y Pago:** El cajero escanea el código QR para cargar la cuenta en su terminal. Verifica el total y procesa el pago.
3.  **Cierre de Orden:** Una vez pagado, la orden se marca como `Finalizada`, la mesa vuelve al estado `Libre` (o `Limpieza`) y se registra en el historial de ventas para el dashboard administrativo.

### 4. Flujo de Gestión de Inventario (Admin)
1.  **Recepción de Mercancía:** El administrador registra la entrada de nuevos productos mediante "Lotes" (`InventoryLot`), especificando cantidad, costo y fecha de caducidad.
2.  **Monitoreo:** El sistema agrupa los lotes de un mismo insumo y calcula el stock total disponible.
3.  **Alertas:** Si un insumo llega al `minStock` definido o algún lote está por caducar (ventana de 7 días), el sistema genera alertas automáticas para el equipo administrativo y de cocina.

---

## 🌐 Comparativa con la PWA

Aunque la **Android App** y la **PWA** comparten el mismo backend y gran parte de la lógica de negocio, existen diferencias clave:

1.  **Paridad en Administración:** El módulo de administrador en Android ofrece las mismas capacidades de gestión que la PWA Administradora, permitiendo al dueño del negocio controlar todo desde su smartphone.
2.  **Enfocada en Operatividad:** La versión Android incluye optimizaciones específicas para la interacción táctil rápida del personal (meseros y chefs) y el uso de hardware (cámara para QR).
3.  **PWA Cliente:** A diferencia de la App Android, la PWA incluye el módulo de **Menú Digital para el Comensal**, optimizado para ser consultado desde el navegador del cliente sin necesidad de instalación.

---

## 📁 Estructura de Directorios

```text
app/src/main/java/com/codex/foodify/
├── data/           # Repositorios, Modelos (DTOs) y servicios API.
├── di/             # Módulos de Inyección de Dependencias (Hilt).
├── ui/             # Organizacional por roles (Admin, Waiter, Chef, Cashier).
├── utils/          # Managers (ThemeManager, Constants) y Helpers.
└── FoodifyApp.kt   # Configuración global de la aplicación.
```

---
© 2026 Foodify - Codex Group. Todos los derechos reservados.
