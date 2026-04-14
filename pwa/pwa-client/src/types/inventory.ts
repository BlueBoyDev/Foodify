export interface IngredientBatch {
  id: string;
  ingredientId: string;
  quantity: number;        // cantidad actual en el lote
  costPerUnit: number;     // costo_compra por unidad
  entryDate: string;       // fecha_entrada (ISO) — ordenado ASC para FIFO
  expiryDate?: string;     // fecha_vencimiento (ISO)
  status: "active" | "exhausted" | "expired";
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;            // "kg", "L", "pzas", "g", "ml"
  currentStock: number;    // stock actual total
  minStock: number;        // stock_minimo para alertas
  category: string;        // "Carnes", "Lácteos", "Verduras", etc.
  batches: IngredientBatch[];
}

export type StockAlertLevel = "critical" | "low" | "expiring" | "ok";

export function getAlertLevel(ingredient: Ingredient): StockAlertLevel {
  const hasExpiring = ingredient.batches.some((b) => {
    if (!b.expiryDate || b.status !== "active") return false;
    const daysLeft = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
    return daysLeft <= 3;
  });
  if (ingredient.currentStock === 0)                        return "critical";
  if (ingredient.currentStock < ingredient.minStock)        return "low";
  if (hasExpiring)                                          return "expiring";
  return "ok";
}