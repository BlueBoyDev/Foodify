import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, OrderStatus } from "@/types/orders";
import { getActiveOrdersApi, updateOrderStatusApi, getKitchenOrdersApi, updateKitchenStatusApi } from "@/lib/ordersApi";

const STORAGE_KEY = "foodify_guest_orders";
const POLL_FALLBACK_INTERVAL = 15000; // 15sfallback if socket fails

function readLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeLocalOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

// Hook para staff — Real-time con Sockets (T38)
export function useSharedOrders(mode: "orders" | "kitchen" = "orders") {
  const [orders, setOrders]   = useState<Order[]>(() => readLocalOrders());
  const [isReady, setIsReady] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const lastSnapshotRef = useRef<string>("");

  const fetchFromBackend = useCallback(async () => {
    try {
      const data = mode === "kitchen"
        ? await getKitchenOrdersApi()
        : await getActiveOrdersApi();

      const snapshot = JSON.stringify(data);
      if (snapshot !== lastSnapshotRef.current) {
        lastSnapshotRef.current = snapshot;
        setOrders(data);
      }
      setUseBackend(true);
      return data;
    } catch {
      setUseBackend(false);
      return [];
    }
  }, [mode]);

  useEffect(() => {
    // 1. Carga inicial
    fetchFromBackend().then(() => setIsReady(true));

    // 2. Polling Estable (15s) — Reemplaza Sockets para evitar errores de conexión
    const interval = setInterval(() => {
      fetchFromBackend();
    }, POLL_FALLBACK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [fetchFromBackend]);

  const updateStatus = useCallback(async (id: string, status: OrderStatus) => {
    // Optimistic update
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    try {
      if (mode === "kitchen") await updateKitchenStatusApi(id, status);
      else await updateOrderStatusApi(id, status);
      // Backend status is definitive
    } catch (e) {
      console.error("Error updating status:", e);
      fetchFromBackend(); // Rollback to actual backend state
    }
  }, [mode, fetchFromBackend]);

  return { orders, updateStatus, isReady };
}
