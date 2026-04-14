# Testing Manual: Módulo de Pedidos Para Llevar

## Resumen de Correcciones Aplicadas

### 1. ✅ lib/ordersApi.ts
**Cambios:**
- Removida propiedad `restaurantId` del payload de `createPublicOrderApi`
- URL del endpoint corregida a `/api/v1/orders`
- Validación de respuesta: `data.data ?? data`
- Endpoint de seguimiento: `/menu/:slug/order/:folio`

**Función Original:**
```typescript
// ANTES (INCORRECTO)
await publicApi.post("/orders", {
  type: "takeout",
  restaurantId: restaurantId,  // ❌ NO ESPERADO
  customerName, 
  customerPhone, 
  items
})
```

**Función Corregida:**
```typescript
// DESPUÉS (CORRECTO)
await publicApi.post("/api/v1/orders", {
  type: "takeout",  // ✅ SOLO TIPO
  customerName,     // ✅ REQUERIDO
  customerPhone,    // ✅ REQUERIDO
  items             // ✅ REQUERIDO
})
```

---

### 2. ✅ app/para-llevar/page.tsx
**Cambios:**
- Agregada validación de teléfono (10-15 dígitos)
- Removida pasada de `restaurantId` en la llamada
- Mejorados mensajes de error específicos

**Validación de Teléfono:**
```typescript
const phoneDigits = customerPhone.replace(/\D/g, '');
if (phoneDigits.length < 10 || phoneDigits.length > 15) {
  toast.error("Ingresa un teléfono válido (10-15 dígitos)");
  return;
}
```

---

### 3. ✅ app/menu/[slug]/order/[folio]/page.tsx
**Cambios:**
- Importado `getOrderByFolioApi` desde `@/lib/ordersApi`
- Usada la función correcta en lugar de llamadas directas a `api.get`
- Agregada función de mapeo `mapStatusToDisplayStatus`
- Endpoint correcto: `/menu/:slug/order/:folio`

**Antes:**
```typescript
const res = await api.get(`/public/order/${folio}`);  // ❌ INCORRECTO
```

**Después:**
```typescript
const internalOrder = await getOrderByFolioApi(slug as string, folio as string);  // ✅ CORRECTO
```

---

### 4. ✅ lib/useGuestOrders.ts
**Estado:**
- Ya tenía protección SSR correcta (`typeof window !== "undefined"`)
- No requería cambios

---

### 5. ✅ types/menu.ts
**Cambios:**
- Agregada propiedad `specialNotes?: string` a `CartItem`

---

## Testing Manual - Pasos

### Paso 1: Verificar que la PWA compila
```bash
cd pwa-client
npm run build
```
**Esperado:** Sin errores de compilación.

---

### Paso 2: Verificar URLs de conexión
**Verificar en DevTools (F12 → Network) que:**

1. **Obtener menú público:**
   ```
   GET http://3.142.73.52:3000/menu/comedor-verapaz?mode=takeout
   ```
   **Response esperada:**
   ```json
   {
     "data": {
       "restaurant": { "id": 3, "name": "...", "slug": "comedor-verapaz", ... },
       "menus": [ { "id": 1, "name": "...", "categories": [...] } ]
     },
     "status": 200
   }
   ```

2. **Crear orden:**
   ```
   POST http://3.142.73.52:3000/api/v1/orders
   Content-Type: application/json
   
   {
     "type": "takeout",
     "customerName": "Juan Pérez",
     "customerPhone": "3312345678",
     "items": [
       { "dishId": 3, "quantity": 2 }
     ]
   }
   ```
   **Response esperada (201 Created):**
   ```json
   {
     "data": {
       "id": 42,
       "orderNumber": "0023",
       "type": "takeout",
       "status": "pending",
       "customerName": "Juan Pérez",
       "qrCode": "data:image/png;base64,...",
       "total": 197.20,
       "items": [ ... ],
       "createdAt": "2026-04-13T10:30:00.000Z"
     },
     "status": 201
   }
   ```

3. **Seguimiento de orden:**
   ```
   GET http://3.142.73.52:3000/menu/comedor-verapaz/order/0023
   ```
   **Response esperada:**
   ```json
   {
     "data": {
       "id": 42,
       "orderNumber": "0023",
       "status": "preparing",
       "kitchenStatus": "preparing",
       "customerName": "Juan Pérez",
       "qrCode": "data:image/png;base64,...",
       "total": 197.20,
       "items": [ ... ],
       "received": true
     },
     "status": 200
   }
   ```

---

### Paso 3: Test en la PWA

#### 3a. Acceder a Para Llevar
```
URL: http://localhost:3000/para-llevar?slug=comedor-verapaz
```
- ✅ Debe cargar el menú del restaurante
- ✅ Debe mostrar categorías y platos

#### 3b. Agregar producto al carrito
- ✅ Click en un plato → modal con descripción
- ✅ Aumentar cantidad
- ✅ "Agregar a la orden"

#### 3c. Crear orden (Prueba EXITOSA)
- ✅ Ingresar nombre: "Juan Pérez"
- ✅ Ingresar teléfono: "3312345678"
- ✅ Click en "COMPLETAR PEDIDO"
- ✅ Debe recibir respuesta 201 del backend
- ✅ Mostrar modal de confirmación con QR
- ✅ Mostrar folio del pedido (ej: "0023")

#### 3d. Crear orden (Prueba CON ERRORES)
**Error 1: Teléfono inválido**
- Ingresar teléfono: "123" (< 10 dígitos)
- Click en "COMPLETAR PEDIDO"
- ✅ Toast: "Ingresa un teléfono válido (10-15 dígitos)"
- ❌ NO debe enviar al backend

**Error 2: Nombre vacío**
- Dejar nombre vacío
- Click en "COMPLETAR PEDIDO"
- ✅ Toast: "Por favor ingresa tu nombre"
- ❌ NO debe enviar al backend

**Error 3: Carrito vacío**
- Vaciar carrito
- Click en "COMPLETAR PEDIDO"
- ✅ Toast: "Tu carrito está vacío"
- ❌ NO debe enviar al backend

#### 3e. Seguimiento de orden
- ✅ Click en "Seguir mi pedido" desde modal de confirmación
- ✅ Debe abrir: `/menu/comedor-verapaz/order/0023`
- ✅ Debe mostrar timeline de estados
- ✅ Debe mostrar QR
- ✅ Auto-refresh cada 30 segundos sin recargar

---

## Arquitectura de Endpoints

### Base URLs
- **Dev:** `http://3.142.73.52:3000` (sin `/api/v1` para rutas públicas)
- **Prod:** `/api_proxy` (proxy de Vercel)

### Rutas Públicas (sin JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/menu/:slug?mode=takeout` | Obtener menú público |
| POST | `/api/v1/orders` | Crear orden para llevar |
| GET | `/menu/:slug/order/:folio` | Seguimiento de orden |

### Rutas Autenticadas (con JWT)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/orders/active` | Órdenes activas |
| PATCH | `/api/v1/orders/:id/status` | Cambiar estado |

---

## Checklist Final

- [x] ordersApi.ts: `createPublicOrderApi` sin `restaurantId`
- [x] ordersApi.ts: `getOrderByFolioApi` con endpoint correcto
- [x] para-llevar/page.tsx: Validación de teléfono
- [x] para-llevar/page.tsx: Llamada sin `restaurantId`
- [x] menu/[slug]/order/[folio]/page.tsx: Usando `getOrderByFolioApi`
- [x] types/menu.ts: `CartItem` con `specialNotes`
- [x] next.config.ts: Configuración sin turbo errors
- [ ] ✅ Build sin errores
- [ ] ✅ Test manual: Crear orden exitosa
- [ ] ✅ Test manual: Validaciones de error
- [ ] ✅ Test manual: Seguimiento de orden

---

## Notas Importantes

1. **Headers**: Las peticiones públicas NO deben incluir `Authorization` header
2. **Respuestas**: Siempre vienen en formato `{ data: T, status: N }`
3. **Teléfono**: Validar localmente (10-15 dígitos) ANTES de enviar al backend
4. **Tipos**: `dishId` y `quantity` deben ser `number` (no string)
5. **Folio**: Es el `orderNumber` del backend (ej: "0023")

---

## Logs a Monitorear

En DevTools Console, esperar estos logs:
```javascript
// Menú cargado
[Menu] Fetching public menu for slug: "comedor-verapaz", mode: "takeout"

// Orden creada
Order creation success: { id: 42, folio: "0023", ... }

// Seguimiento actualizado
Order tracking: { status: "preparing", items: [...], ... }
```

---

