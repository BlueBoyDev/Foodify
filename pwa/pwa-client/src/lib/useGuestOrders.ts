"use client";

import { useState, useEffect, useCallback } from "react";
import { useGuest } from "@/context/GuestContext";
import type { Order } from "@/types/orders";

const STORAGE_KEY = "foodify_guest_orders";

function readOrders(): Order[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function useGuestOrders() {
  const { sessionId, isReady } = useGuest();

  const [allOrders, setAllOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return [];
    return readOrders();
  });
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    // Escuchar cambios desde otras pestañas
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setAllOrders(readOrders());
    };
    window.addEventListener("storage", onStorage);

    // Usar un pequeño delay para evitar advertencias de cascading render síncrono
    const timer = setTimeout(() => {
      setDataReady(true);
    }, 0);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearTimeout(timer);
    };
  }, []);

  // Filtrar por sesión — cuando sessionId ya esté disponible
  const myOrders = isReady && sessionId
    ? allOrders.filter((o) => o.sessionId === sessionId)
    : allOrders;

  const addOrder = useCallback(
    (order: Omit<Order, "sessionId">) => {
      if (!sessionId) return;
      const newOrder: Order = { ...order, sessionId };
      const updated = [newOrder, ...allOrders];
      writeOrders(updated);
      setAllOrders(updated);
    },
    [sessionId, allOrders]
  );

  const cancelOrder = useCallback(
    (id: string) => {
      const updated = allOrders.map((o) =>
        o.id === id ? { ...o, status: "cancelado" as const } : o
      );
      writeOrders(updated);
      setAllOrders(updated);
    },
    [allOrders]
  );

  return { myOrders, addOrder, cancelOrder, isReady: dataReady };
}