// ─── Estado del pedido ────────────────────────────────────────────────────────
export type OrderStatus =
  | "nuevo"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

// ─── Item dentro de un pedido ─────────────────────────────────────────────────
export interface OrderItem {
  dishId: string;
  dishName: string;
  qty: number;
  unitPrice: number;
}

// ─── Pedido ───────────────────────────────────────────────────────────────────
export interface Order {
  id: string;
  folio: string;
  sessionId?: string;   // ← ID de sesión del comensal (localStorage)
  tableId?: string;
  status: OrderStatus;
  items: OrderItem[];
  notes?: string;
  qrCode?: string;     // ← Imagen del QR en Base64
  createdAt: string;    // ISO string
  attendedBy?: string;
  branch?: string;
}
