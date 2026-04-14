import { api, publicApi } from "./api/axios";
import type { Order, OrderStatus } from "../types/orders";

export const USE_MOCK_ORDERS = false;

function mapStatus(s: string): OrderStatus {
  switch (s.toLowerCase()) {
    case "pending":    return "nuevo";
    case "confirmed":  return "nuevo";
    case "preparing":  return "en_preparacion";
    case "prepared":   return "listo";
    case "ready":      return "listo";
    case "delivered":  return "entregado";
    case "completed":  return "entregado";
    case "cancelled":  return "cancelado";
    default:           return "nuevo";
  }
}

export function mapStatusToBackend(status: OrderStatus): string {
  switch (status) {
    case "nuevo":          return "pending";
    case "confirmado":     return "confirmed";
    case "en_preparacion": return "preparing";
    case "listo":          return "ready";
    case "entregado":      return "delivered";
    case "cancelado":      return "cancelled";
    default:               return "pending";
  }
}

function mapToInternalOrder(o: Record<string, unknown>): Order {
  const items = (o.items as Record<string, unknown>[] ?? []).map((it) => ({
    dishId:    String((it.dish as Record<string, unknown>)?.id ?? it.dishId ?? ""),
    dishName:  String((it.dish as Record<string, unknown>)?.name ?? it.dishName ?? ""),
    name:      String((it.dish as Record<string, unknown>)?.name ?? it.dishName ?? ""),
    qty:       Number(it.quantity ?? it.qty ?? 1),
    unitPrice: Number(it.unitPrice ?? it.unit_price ?? 0),
  }));

  // Priorizamos kitchen_status si status es básico (pending/confirmed)
  const rawStatus = String(o.status ?? "pending");
  const rawKitchen = String(o.kitchen_status ?? o.kitchenStatus ?? "");
  
  let finalStatus = mapStatus(rawStatus);
  
  // Si el estado de cocina es 'ready', forzamos a 'listo'
  if (rawKitchen === "ready" || rawKitchen === "prepared") {
    finalStatus = "listo";
  } else if (rawStatus === "pending" && (rawKitchen === "preparing")) {
    finalStatus = "en_preparacion";
  }

  return {
    id:         String(o.id),
    folio:      String(o.orderNumber ?? o.order_number ?? o.folio ?? o.id),
    tableId:    o.tableNumber ? String(o.tableNumber) : (o.table as any)?.number ? String((o.table as any).number) : (o.tableId ? String(o.tableId) : undefined),
    status:     finalStatus,
    createdAt:  String(o.createdAt ?? o.created_at ?? new Date().toISOString()),
    attendedBy: String(o.waiterName ?? (o.waiter as any)?.fullName ?? (o.waiter as any)?.name ?? o.attendedBy ?? "—"),
    branch:     "Restaurante",
    items,
    qrCode:     String(o.qr_code ?? o.qrCode ?? ""),
  };
}

/**
 * ─── Crear orden pública (comensal Para Llevar) — SIN JWT v3.2 (Guide) ─────────
 * IMPORTANT: El servidor v3.2-guide REQUIERE restaurantId en el body para
 * peticiones @Public (@see orders.controller.ts:96).
 * Se ha parcheado el CreateOrderDto para permitir este campo.
 */
export async function createPublicOrderApi(payload: {
  restaurantId: number;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: { dishId: number; quantity: number; specialNotes?: string }[];
}): Promise<Order> {
  // Payload exacto que espera el backend v3.2
  const purifiedPayload = {
    restaurantId:  Number(payload.restaurantId),
    type:          "takeout",
    customerName:  payload.customerName.trim(),
    customerPhone: payload.customerPhone.trim(),
    notes:         payload.notes?.trim() || undefined,
    items: payload.items.map(item => ({
      dishId:       Number(item.dishId),
      quantity:     Number(item.quantity),
      specialNotes: item.specialNotes?.trim() || undefined
    }))
  };

  const { data } = await publicApi.post("/orders", purifiedPayload);

  // Backend devuelve: { data: Order, status: 201 }
  const rawOrder = data.data ?? data;
  return mapToInternalOrder(rawOrder);
}

// ─── Seguimiento de orden por folio (público) ─────────────────────────────────
export async function getOrderByFolioApi(slug: string, folio: string): Promise<Order | null> {
  try {
    // Endpoint correcto: /menu/:slug/order/:folio (sin /api/v1)
    const { data } = await publicApi.get(`/menu/${slug}/order/${folio}`);
    return mapToInternalOrder(data.data ?? data);
  } catch { return null; }
}

// ─── Listar órdenes activas (staff) ──────────────────────────────────────────
export async function getActiveOrdersApi(): Promise<Order[]> {
  const { data } = await api.get("/orders/active");
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map(mapToInternalOrder);
}

// ─── Listar todas las órdenes con filtros ─────────────────────────────────────
export async function getOrdersApi(params?: {
  status?: string; dateFrom?: string; dateTo?: string;
  page?: number; limit?: number;
}): Promise<Order[]> {
  const { data } = await api.get("/orders", { params });
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map(mapToInternalOrder);
}

// ─── Cambiar estado de orden ──────────────────────────────────────────────────
export async function updateOrderStatusApi(id: string, status: OrderStatus): Promise<void> {
  await api.patch(`/orders/${id}/status`, { status: mapStatusToBackend(status) });
}

// ─── Cancelar orden ───────────────────────────────────────────────────────────
export async function cancelOrderApi(id: string, reason = "Cancelado por el cliente"): Promise<void> {
  await api.patch(`/orders/${id}/cancel`, { reason });
}

// ─── Comandas de cocina (Premium) ─────────────────────────────────────────────
export async function getKitchenOrdersApi(): Promise<Order[]> {
  const { data } = await api.get("/kitchen/orders");
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map(mapToInternalOrder);
}

export async function updateKitchenStatusApi(orderId: string, status: OrderStatus): Promise<void> {
  // En v3.2, hay un endpoint específico para kitchen-status
  await api.patch(`/orders/${orderId}/kitchen-status`, { 
    kitchenStatus: mapStatusToBackend(status) 
  });
}