import { api } from "./api/axios";
import type { Ingredient, IngredientBatch } from "../types/inventory";


// ─── Mapear respuesta del backend al tipo interno ─────────────────────────────
function mapItem(i: Record<string, unknown>): Ingredient {
  const lots = ((i.lots as Record<string, unknown>[]) ?? []).map((l): IngredientBatch => ({
    id:           String(l.id),
    ingredientId: String(i.id),
    quantity:     Number(l.quantity),
    costPerUnit:  Number(l.costPerUnit ?? l.unit_cost ?? l.unitCost ?? 0),
    entryDate:    String(l.entryDate ?? l.entry_date ?? new Date().toISOString()),
    expiryDate:   l.expiryDate ? String(l.expiryDate) : (l.expiry_date ? String(l.expiry_date) : undefined),
    status:       (l.status as "active" | "exhausted" | "expired") ?? "active",
  }));

  return {
    id:           String(i.id),
    name:         String(i.name),
    unit:         String(i.unit ?? "kg"),
    currentStock: Number(i.currentStock ?? i.current_stock ?? i.stock_actual ?? 0),
    minStock:     Number(i.minStock ?? i.min_stock ?? i.stock_minimo ?? 0),
    category:     String(i.category ?? "General"),
    batches:      lots,
  };
}

// ─── Listar ingredientes ──────────────────────────────────────────────────────
export async function getInventoryItemsApi(): Promise<Ingredient[]> {
  try {
    const { data } = await api.get("/inventory/items");
    const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
    return list.map(mapItem);
  } catch (e) {
    throw e;
  }
}

// ─── Crear ingrediente ────────────────────────────────────────────────────────
export async function createInventoryItemApi(payload: {
  name: string; unit: string; minStock: number; category: string;
}): Promise<Ingredient> {
  const { data } = await api.post("/inventory/items", payload);
  return mapItem(data.data);
}

// ─── Actualizar ingrediente ───────────────────────────────────────────────────
export async function updateInventoryItemApi(id: string, payload: Partial<{
  name: string; unit: string; minStock: number; category: string;
}>): Promise<Ingredient> {
  const { data } = await api.put(`/inventory/items/${id}`, payload);
  return mapItem(data.data);
}

// ─── Registrar lote (entrada de mercancía) ────────────────────────────────────
export async function createLotApi(
  itemId: string,
  payload: {
    quantity: number;
    unitCost: number;
    expiryDate?: string;
    entryDate?: string;
    lotNumber?: string;
    supplier?: string;
  }
): Promise<IngredientBatch> {
  const apiPayload = {
    itemId: Number(itemId),
    quantity: payload.quantity,
    unitCost: payload.unitCost,
    entryDate: payload.entryDate || new Date().toISOString(),
    expiryDate: payload.expiryDate,
    lotNumber: payload.lotNumber,
    supplier: payload.supplier,
  };
  const { data } = await api.post("/inventory/lots", apiPayload);
  const l = data.data || {};
  return {
    id:           String(l.id || Date.now()),
    ingredientId: String(itemId),
    quantity:     Number(l.quantity ?? payload.quantity),
    costPerUnit:  Number(l.unitCost ?? payload.unitCost),
    entryDate:    String(l.entryDate ?? payload.entryDate ?? new Date().toISOString()),
    expiryDate:   l.expiryDate ? String(l.expiryDate) : payload.expiryDate,
    status:       (l.status as "active" | "exhausted" | "expired") ?? "active",
  };
}

// ─── Ajustes de inventario ───────────────────────────────────────────────────
export async function createAdjustmentApi(payload: {
  itemId: number;
  lotId: number;
  quantity: number;
  type: 'sale' | 'waste' | 'adjustment' | 'entry';
  notes?: string;
}): Promise<void> {
  await api.post("/inventory/adjustments", payload);
}

// ─── Ver movimientos ─────────────────────────────────────────────────────────
export async function getInventoryMovementsApi(params?: {
  page?: number;
  limit?: number;
  lotId?: number;
  type?: string;
}): Promise<{
  id: string;
  lotId: string;
  type: string;
  quantity: number;
  notes: string;
  createdAt: string;
}[]> {
  const { data } = await api.get("/inventory/movements", { params });
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map((m: any) => ({
    id: String(m.id),
    lotId: String(m.lotId),
    type: m.type,
    quantity: Number(m.quantity),
    notes: m.notes ?? "",
    createdAt: m.createdAt,
  }));
}

// ─── Obtener alertas activas ──────────────────────────────────────────────────
export async function getInventoryAlertsApi(): Promise<{
  id: string; itemName: string; alertType: string; currentStock: number;
}[]> {
  try {
    const { data } = await api.get("/inventory/alerts");
    const list = Array.isArray(data.data) ? data.data : [];
    return list.map((a: Record<string, unknown>) => ({
      id:           String(a.id),
      itemName:     String(a.itemName ?? a.item_name ?? ""),
      alertType:    String(a.type ?? a.alertType ?? ""),
      currentStock: Number(a.currentStock ?? a.current_stock ?? 0),
    }));
  } catch { return []; }
}

// ─── Resolver alerta ──────────────────────────────────────────────────────────
export async function resolveAlertApi(id: string): Promise<void> {
  await api.patch(`/inventory/alerts/${id}/resolve`);
}