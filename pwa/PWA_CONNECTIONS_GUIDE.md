# 🔗 Guía de Conexión y Sincronización: PWA & Mobile

Este documento detalla la arquitectura de comunicación entre la **PWA de Foodify** (Público, Admin, Codex) y las **Aplicaciones Móviles** (Mesero, Chef, Cajero) para garantizar que operen como un ecosistema unificado en tiempo real.

---

## 🏗️ Arquitectura de Sincronización
Ambas plataformas (PWA y Android) consumen la misma **Rest API** y se conectan a los mismos **Namespaces de Socket.io**. 

- **PWA**: Actúa como el punto de entrada para comensales (pedidos) y la central de mando para el Admin (configuración).
- **Mobile**: Actúa como la herramienta operativa de campo para el personal de piso y cocina.

---

## 📡 Comunicación en Tiempo Real (Socket.io)
Para que la PWA y la App Móvil estén sincronizadas, la PWA debe implementar la misma lógica del `WebSocketManager` de Android.

### Namespaces:
1.  `/kitchen`: Utilizado por el Chef (App) y visible para el Admin (PWA) de solo lectura.
2.  `/restaurant`: Utilizado por Meseros/Cajeros (App) y el Admin/Comensal (PWA).

### Eventos Clave para la PWA:
| Evento | Dirección | Propósito |
| :--- | :--- | :--- |
| `order:new_notification` | Backend → PWA/Mobile | Alerta global cuando un comensal hace un pedido en la PWA. |
| `order:status` | Backend → PWA | Actualiza instantáneamente el Timeline de seguimiento en la web. |
| `order:ready` | Mobile (Chef) → PWA | Notifica al comensal y al admin que el pedido puede ser retirado. |
| `inventory:alert` | Backend → PWA Admin | Notifica al administrador sobre stock bajo detectado por ventas en el móvil. |
| `dish:unavailable` | Backend → PWA Público | Oculta automáticamente un platillo en el menú digital. |

---

## 🔌 Mapeo de Endpoints (Rest API)
La PWA debe consumir estos endpoints para mantener la paridad con la base de datos que usa la app móvil.

### 1. Módulo Público (/menu/[slug])
- `GET /dishes`: Obtener platillos filtrados por disponibilidad.
- `GET /menus`: Obtener menús activos.
- `POST /orders`: Crear pedido Para Llevar (notifica al personal móvil vía Socket).
- `GET /orders/:folio`: Seguimiento de pedido en tiempo real.

### 2. Módulo Administrativo (/admin)
- `GET /reports/sales`: Reportes de ventas generadas tanto en PWA como en Móvil.
- `GET /reports/dishes/top`: Platillos con mayor éxito en todos los canales.
- `POST /dishes`: Actualizar el menú (impacta instantáneamente en la app del Mesero).
- `GET /inventory/items`: Gestionar stock que el personal móvil consume al marcar platillos como "Vendidos".

### 3. Módulo Codex (/codex)
- `GET /admin/restaurants`: Monitoreo global de actividad.
- `GET /reports/staff`: Métricas de desempeño del personal usando la app móvil.

---

## 🔐 Seguridad y Autenticación
- **JWT Compartido**: La PWA utiliza el mismo sistema de tokens que la App Móvil (`Authorization: Bearer <JWT>`).
- **Persistencia**: LocalStorage en PWA es equivalente al DataStore en Android.
- **Handshake de Socket**: Se debe enviar el token en el handshake de Socket.io para autorizar la conexión a los namespaces restringidos.

---

## 🔄 Flujo de Datos Ejemplo
1.  **Comensal (PWA)**: Realiza un pedido → `POST /orders`.
2.  **Backend**: Guarda pedido y emite `order:new_notification`.
3.  **Mesero (Móvil)**: Recibe alerta visual y sonora instantánea.
4.  **Chef (Móvil)**: Inicia preparación → `PATCH /order-items/:id/status`.
5.  **Comensal (PWA)**: El Timeline de seguimiento se mueve a "En Cocina" sin recargar la página.

---

> [!NOTE]
> Es vital que los modelos de datos (JSON) en la PWA coincidan exactamente con las interfaces de `Models.kt` en Android para evitar errores de parseo en el backend.

---

## 🏗️ Infraestructura y Conectividad del Backend

Para que la PWA y la App Móvil operen en sincronía, ambas deben apuntar al mismo núcleo de servicios.

### 📍 Servidor de Producción / Desarrollo
- **API Base URL**: `http://3.142.73.52:3000/api/v1`
- **Socket Base URL**: `ws://3.142.73.52:3000` (Socket.io)
- **Base de Datos**: MySQL (Misma instancia para PWA y Móvil)
- **Almacenamiento**: AWS S3 (Bucket: `foodify-assets-dev`)

### 🛠️ Configuración en la PWA
Crea un archivo `.env.local` con las siguientes variables:
```env
NEXT_PUBLIC_API_URL=http://3.142.73.52:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://3.142.73.52:3000
```

### 🔐 Desafío de Conectividad (HTTPS / HTTP)
Dado que el backend corre bajo **HTTP** y la PWA desplegada (ej. en Vercel) corre bajo **HTTPS**, los navegadores bloquean las peticiones por seguridad (Mixed Content).

**Solución Implementada**:
La PWA utiliza un **Rewrite/Proxy** en su servidor de despliegue:
1.  La PWA hace peticiones locales a `/api_proxy/*`.
2.  El servidor de Next.js redirige esas peticiones internamente al backend en `3.142.73.52:3000`.
3.  Esto elimina los errores de CORS y Mixed Content sin necesidad de SSL en el backend (temporalmente).

### 🗄️ Consistencia de Datos
El backend utiliza **TypeORM**. Es fundamental que los objetos enviados desde la PWA (ej. un `CreateOrderRequest`) tengan el mismo formato que los definidos en el móvil para evitar que el backend rechace la petición:
- Los IDs de los platillos deben ser `number`.
- Los montos deben ser `number` (float).
- Las fechas en ISO 8601.

---

> [!IMPORTANT]
> **Sincronización de Base de Datos**: Cualquier cambio en el esquema (ej. añadir un campo a `Dish`) debe ser reflejado en la App Móvil (Kotlin) y en la PWA (TypeScript) al mismo tiempo para evitar que una aplicación falle al leer datos creados por la otra.
