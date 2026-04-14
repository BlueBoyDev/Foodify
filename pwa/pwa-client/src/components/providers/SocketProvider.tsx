"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { socketManager, getKitchenSocket, getRestaurantSocket } from "@/lib/api/socket";
import toast from "react-hot-toast";

const SocketContext = createContext<null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated, user } = useAuthStore();
  const kitchenSocketRef = useRef<any>(null);
  const restaurantSocketRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketManager.disconnectAll();
      return;
    }

    // Initialize/Reconnect sockets when auth state changes
    const kSocket = getKitchenSocket();
    const rSocket = getRestaurantSocket();

    kitchenSocketRef.current = kSocket;
    restaurantSocketRef.current = rSocket;

    if (!kSocket || !rSocket) return;

    // ─── KITCHEN EVENTS ─────────────────────────────────────────────────────────
    kSocket.on("order:ready", (data: any) => {
      toast.success(`Pedido #${data.folio || data.id} listo para entrega! 🔔`, { duration: 5000 });
    });

    // ─── RESTAURANT EVENTS ──────────────────────────────────────────────────────
    rSocket.on("order:new_notification", (data: any) => {
      toast(`Nuevo pedido recibido! 🥘`, { icon: '🔥', duration: 5000 });
    });

    rSocket.on("inventory:alert", (data: any) => {
      toast.error(`Alerta de Inventario: ${data.itemName} está por agotarse!`, { duration: 6000 });
    });

    rSocket.on("dish:unavailable", (data: any) => {
      console.log("Dish marked unavailable globally:", data.dishId);
    });

    return () => {
      kSocket.off("order:ready");
      rSocket.off("order:new_notification");
      rSocket.off("inventory:alert");
      rSocket.off("dish:unavailable");
    };
  }, [token, isAuthenticated]);

  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
