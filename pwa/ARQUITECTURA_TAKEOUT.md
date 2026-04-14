# 🏗️ Arquitectura del Módulo Para Llevar - Documentación Técnica

## Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLIENTE (PWA - Next.js)                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PÁGINA: /para-llevar?slug=comedor-verapaz&mode=takeout             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ParaLlevarContent Component                                 │   │
│  │                                                               │   │
│  │  State:                                                       │   │
│  │  - cart: CartItem[] ← { dish, qty, specialNotes }           │   │
│  │  - customerName: string                                     │   │
│  │  - customerPhone: string                                    │   │
│  │  - selectedDish: Dish | null (modal)                        │   │
│  │  - lastOrder: CreateOrderResult | null (confirmación)       │   │
│  │                                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                             ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Handlers:                                                     │   │
│  │ - addToCart(dish, qty)                                       │   │
│  │ - removeFromCart(id)                                         │   │
│  │ - handleCreateOrder() ← VALIDACIONES AQUÍ                    │   │
│  │ - updateQty(id, delta)                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
          ↑                                  ↓
          │                                  │
    ┌─────┴──────────────────────────────────┴─────────┐
    │                                                   │
    │  LLAMADAS A API (axios)                          │
    │                                                   │
    ├─────────────────────────────────────────────────┤
    │                                                   │
    │  1. fetchPublicMenu(slug, mode)                  │
    │     GET /menu/comedor-verapaz?mode=takeout       │
    │     → publicApi.get("/menu/:slug")               │
    │                                                   │
    │  2. createPublicOrderApi(params)                 │
    │     POST /api/v1/orders                          │
    │     → publicApi.post("/api/v1/orders", {         │
    │          type: "takeout",                        │
    │          customerName,                           │
    │          customerPhone,                          │
    │          items: [...]                            │
    │        })                                         │
    │                                                   │
    │  3. getOrderByFolioApi(slug, folio)              │
    │     GET /menu/:slug/order/:folio                 │
    │     → publicApi.get("/menu/:slug/order/:folio")  │
    │                                                   │
    └─────────────────────────────────────────────────┘
           ↑
           │
    ┌──────┴────────────────────────────────────────┐
    │                                               │
    │  axios instances (lib/api/axios.ts)           │
    │                                               │
    │  publicApi.baseURL = 'http://3.142.73.52:3000'│
    │  NO headers.Authorization                     │
    │  timeout: 10000ms                             │
    │                                               │
    └──────┬────────────────────────────────────────┘
           ↓
┌──────────────────────────────────────────────────────────┐
│              BACKEND REST API (Express/NestJS)           │
├──────────────────────────────────────────────────────────┤
│  Base URL: http://3.142.73.52:3000                       │
│                                                          │
│  ENDPOINTS PÚBLICOS (sin JWT):                           │
│                                                          │
│  ✅ GET /menu/:slug?mode=takeout                        │
│     Retorna: { data: { restaurant, menus }, status }    │
│                                                          │
│  ✅ POST /api/v1/orders                                 │
│     Body: { type, customerName, customerPhone, items }  │
│     Retorna: { data: Order, status: 201 }               │
│     ※ Emite evento socket: order:new_notification       │
│                                                          │
│  ✅ GET /menu/:slug/order/:folio                        │
│     Retorna: { data: OrderStatus, status }              │
│                                                          │
│  ENDPOINTS AUTENTICADOS (con JWT):                       │
│                                                          │
│  🔐 GET /api/v1/orders/:id                              │
│  🔐 PATCH /api/v1/orders/:id/status                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
           ↑
           │ WebSocket (Socket.io)
           │ Namespace: /restaurant, /kitchen
           │
    ┌──────┴────────────────────┐
    │                            │
    │  EVENTOS EN TIEMPO REAL:   │
    │                            │
    │  ← order:status            │
    │     Actualiza estado       │
    │  ← order:ready             │
    │     Notifica al comensal   │
    │  ← dish:unavailable        │
    │     Oculta plato           │
    │                            │
    └────────────────────────────┘
```

---

## Estructura de Datos

### Request: Crear Orden

```typescript
// ✅ CORRECTO
POST /api/v1/orders
Content-Type: application/json

{
  "type": "takeout",                          // String literal
  "customerName": "Juan Pérez",               // String (requerido)
  "customerPhone": "3312345678",              // String (requerido)
  "notes": "Sin cebolla",                     // String (opcional)
  "items": [
    {
      "dishId": 3,                            // Number (requerido)
      "quantity": 2,                          // Number (requerido)
      "specialNotes": "Sin cilantro"          // String (opcional)
    }
  ]
}
```

### Response: Orden Creada

```typescript
// ✅ RESPUESTA 201 Created
{
  "data": {
    "id": 42,                                 // ID único
    "orderNumber": "0023",                    // Folio (string)
    "type": "takeout",
    "status": "pending",                      // pending | confirmed | preparing | ready | delivered | cancelled
    "kitchenStatus": "pending",               // Status específico de cocina
    "customerName": "Juan Pérez",
    "customerPhone": "3312345678",
    "qrCode": "data:image/png;base64,iVBOR...",
    "subtotal": 170.00,
    "taxAmount": 27.20,
    "total": 197.20,
    "items": [
      {
        "id": 1,
        "dishId": 3,
        "dishName": "Tacos al Pastor",
        "quantity": 2,
        "unitPrice": 85.00,
        "subtotal": 170.00
      }
    ],
    "createdAt": "2026-04-13T10:30:00.000Z",
    "received": false
  },
  "status": 201
}
```

### Response: Seguimiento de Orden

```typescript
// ✅ GET /menu/comedor-verapaz/order/0023
{
  "data": {
    "id": 42,
    "orderNumber": "0023",
    "status": "preparing",                    // Estado actual
    "kitchenStatus": "preparing",             // Status de cocina
    "customerName": "Juan Pérez",
    "qrCode": "data:image/png;base64,...",
    "total": 197.20,
    "items": [
      {
        "dishName": "Tacos al Pastor",
        "quantity": 2,
        "unitPrice": 85.00,
        "specialNotes": null
      }
    ],
    "createdAt": "2026-04-13T10:30:00.000Z",
    "received": true                          // ¿Cliente recibió notificación?
  },
  "status": 200
}
```

---

## Validaciones Locales

```typescript
// ✅ VALIDACIÓN 1: Carrito no vacío
if (cart.length === 0) {
  toast.error("Tu carrito está vacío");
  return; // ❌ NO ENVIAR
}

// ✅ VALIDACIÓN 2: Nombre requerido
if (!customerName.trim()) {
  toast.error("Por favor ingresa tu nombre");
  return; // ❌ NO ENVIAR
}

// ✅ VALIDACIÓN 3: Teléfono requerido
if (!customerPhone.trim()) {
  toast.error("Por favor ingresa tu teléfono para el seguimiento");
  return; // ❌ NO ENVIAR
}

// ✅ VALIDACIÓN 4: Formato de teléfono (CRÍTICA)
const phoneDigits = customerPhone.replace(/\D/g, '');
if (phoneDigits.length < 10 || phoneDigits.length > 15) {
  toast.error("Ingresa un teléfono válido (10-15 dígitos)");
  return; // ❌ NO ENVIAR
}

// ✅ TODAS LAS VALIDACIONES PASARON → ENVIAR AL BACKEND
try {
  const res = await createPublicOrderApi({
    customerName: customerName.trim(),
    customerPhone: customerPhone.trim(),
    items: cart.map(i => ({
      dishId: Number(i.dish.id),
      quantity: Number(i.qty)
    }))
  });
  
  // ✅ ÉXITO: Mostrar confirmación
  setLastOrder(res);
  setCart([]);
  
} catch (error) {
  // ❌ ERROR DEL BACKEND: Mostrar mensaje
  toast.error(`Error: ${error.message}`);
}
```

---

## Mapeo de Estados

### Estados Internos de la PWA
```typescript
export type OrderStatus = 
  | "nuevo"            // Recién creado, pendiente de confirmación
  | "confirmado"       // Aceptado por el restaurante
  | "en_preparacion"   // En cocina
  | "listo"            // Listo para recoger
  | "entregado"        // Entregado al comensal
  | "cancelado";       // Cancelado
```

### Estados del Backend
```typescript
// Status general
"pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled"

// Kitchen Status (específico de cocina)
"pending" | "preparing" | "ready" | "delivered"
```

### Mapeo en Página de Seguimiento
```typescript
function mapStatusToDisplayStatus(internalStatus: string): DisplayStatus {
  switch (internalStatus) {
    case "nuevo":
    case "confirmado":
      return "pending";      // Etapa 1: Recibido
    
    case "en_preparacion":
      return "preparing";    // Etapa 2: En cocina
    
    case "listo":
      return "ready";        // Etapa 3: Listo
    
    case "entregado":
      return "delivered";    // Etapa 4: Entregado
    
    case "cancelado":
      return "cancelled";    // Error: Cancelado
    
    default:
      return "pending";
  }
}
```

---

## Componentes Afectados

### 1. `ParaLlevarContent` (app/para-llevar/page.tsx)
- **Responsabilidad:** UI principal, carrito, validaciones
- **Cambios:** Validación de teléfono, llamada correcta a API
- **Estados:** `cart`, `customerName`, `customerPhone`, `lastOrder`
- **Handlers:** `handleCreateOrder()` con validaciones

### 2. `OrderTrackingPage` (app/menu/[slug]/order/[folio]/page.tsx)
- **Responsabilidad:** Seguimiento de orden en tiempo real
- **Cambios:** Usar `getOrderByFolioApi`, mapeo de estados
- **Efectos:** Auto-refresh cada 30 segundos
- **Timeline visual:** Mostrar progreso de estados

### 3. `useGuestOrders` (lib/useGuestOrders.ts)
- **Responsabilidad:** Persistencia de órdenes en localStorage
- **Cambios:** Ninguno necesario (ya tenía SSR protection)
- **Estado:** `myOrders`, `addOrder()`, `cancelOrder()`

---

## Flujo de Errores Manejados

```
┌─────────────────────────────────────────┐
│ ERROR: Validación Local Fallida         │
├─────────────────────────────────────────┤
│ - Carrito vacío                         │
│ - Nombre vacío                          │
│ - Teléfono vacío                        │
│ - Teléfono formato inválido (< 10 digs) │
│ - Teléfono formato inválido (> 15 digs) │
│                                          │
│ → Toast Error                           │
│ → ❌ NO ENVIAR AL BACKEND                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ERROR: Backend 400 Bad Request           │
├─────────────────────────────────────────┤
│ - Teléfono inválido (backend validation)│
│ - Restaurante no encontrado             │
│ - Platillo no disponible                │
│ - Cantidad fuera de rango               │
│                                          │
│ → Extraer message de response           │
│ → Toast Error con detalles              │
│ → Mantener carrito para re-enviar       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ERROR: Backend 403 Forbidden             │
├─────────────────────────────────────────┤
│ - Restaurante cerrado                   │
│ - Modo takeout no disponible            │
│ - Horario fuera de servicio             │
│                                          │
│ → Toast: "Restaurante no acepta pedidos"│
│ → Deshabilitar botón "Completar Pedido" │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ERROR: Backend 500 Server Error          │
├─────────────────────────────────────────┤
│ - Error en base de datos                │
│ - Error generando QR                    │
│ - Error en servicio de terceros         │
│                                          │
│ → Toast: "Error al crear el pedido"     │
│ → Log en console para debugging         │
│ → Permitir reintentar                   │
└─────────────────────────────────────────┘
```

---

## Performance y Optimizaciones

### Caching
```typescript
// fetchPublicMenu - Cache 60 segundos
next: { revalidate: 60 }

// getOrderByFolioApi - Sin cache (siempre fresco)
cache: 'no-store'
```

### Auto-refresh
```typescript
// Página de seguimiento
setInterval(() => {
  fetchOrder(true);  // quiet: true (sin loader)
}, 30_000);          // Cada 30 segundos
```

### Storage
```typescript
// localStorage para órdenes del comensal
localStorage.setItem('foodify_guest_orders', JSON.stringify(orders))

// Máximo 10 órdenes guardadas
const updated = [newOrder, ...allOrders].slice(0, 10)
```

---

## URLs Finales Correctas

| Recurso | Método | URL | Descripción |
|---------|--------|-----|-------------|
| Menú Público | GET | `/menu/comedor-verapaz?mode=takeout` | Obtener menú |
| Crear Orden | POST | `/api/v1/orders` | Crear pedido para llevar |
| Seguimiento | GET | `/menu/comedor-verapaz/order/0023` | Rastrear pedido |
| Órdenes Activas | GET | `/api/v1/orders/active` | (Autenticado) |
| Cambiar Estado | PATCH | `/api/v1/orders/42/status` | (Autenticado) |

---

## Checklist de Implementación

- [x] Remover `restaurantId` de payload
- [x] Corregir URL a `/api/v1/orders`
- [x] Agregar validación de teléfono
- [x] Usar `getOrderByFolioApi` en tracking
- [x] Mapeo de estados correcto
- [x] Type `specialNotes` en CartItem
- [x] Manejo de errores por código HTTP
- [x] Auto-refresh en seguimiento
- [x] Persistencia con `useGuestOrders`
- [x] Next.js config sin turbopack errors
- [ ] Build sin warnings
- [ ] Testing manual completo
- [ ] Deployment a main


