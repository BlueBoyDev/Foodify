"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { getKitchenOrdersApi, updateKitchenStatusApi } from "@/lib/ordersApi";
import type { OrderStatus, Order } from "@/types/orders";
import { FoodSpinner } from "@/components/ui/FoodSpinner";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  IconClock,
  IconChefHat,
  IconCheck,
  IconPlus,
} from "@/components/ui/Icons";

function useRoleGuard(allowed: string[]) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    // Esperar a que termine de leer localStorage antes de redirigir
    if (!isLoading && (!user || !allowed.includes(user.role))) {
      window.location.href = "/login";
    }
  }, [isLoading, user, allowed]);
  return { user, isLoading };
}

export default function CocinaPage() {
  const { user, isLoading: authLoading } = useRoleGuard(["cocina", "admin"]);
  const { logout } = useAuth();

  const {
    data: orders,
    setData: setOrders,
    loading: dataLoading,
    error,
    refetch,
  } = useFetchWithState<Order[]>("/kitchen/orders", getKitchenOrdersApi);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Polling cada 15s para nuevas comandas
  useEffect(() => {
    if (authLoading || dataLoading) return;
    const t = setInterval(refetch, 15000);
    return () => clearInterval(t);
  }, [authLoading, dataLoading, refetch]);

  if (authLoading || (!orders && dataLoading)) return <FoodSpinner />;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  const nuevas        = (orders ?? []).filter(o => o.status === "nuevo");
  const enPreparacion = (orders ?? []).filter(o => o.status === "en_preparacion");

  const tomarOrden = async (id: string) => {
    setUpdatingId(id);
    try {
      await updateKitchenStatusApi(id, "en_preparacion");
      if (setOrders) {
        setOrders(prev => (prev ?? []).map(o => o.id === id ? { ...o, status: "en_preparacion" as OrderStatus } : o));
      }
    } catch (err) {
      alert("Error al actualizar: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setUpdatingId(null);
    }
  };

  const marcarListo = async (id: string) => {
    setUpdatingId(id);
    try {
      await updateKitchenStatusApi(id, "listo");
      if (setOrders) {
        setOrders(prev => (prev ?? []).filter(o => o.id !== id));
      }
    } catch (err) {
      alert("Error al marcar como listo: " + (err instanceof Error ? err.message : "Error desconocido"));
    } finally {
      setUpdatingId(null);
    }
  };

  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  const OrderCard = ({ order, mode }: { order: Order; mode: "nueva" | "preparando" }) => {
    const isNueva = mode === "nueva";
    return (
      <div style={{
        background: "#1a1d21", borderRadius: 16, padding: 16,
        marginBottom: 12,
        border: isNueva ? "1.5px solid #3b82f6" : "1.5px solid #f59e0b",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <IconClock size={12} /> {fmtTime(order.createdAt)}
            </p>
          </div>
          <span style={{
            background: isNueva ? "#1e3a5f" : "#3d2e0a",
            color:      isNueva ? "#3b82f6" : "#f59e0b",
            fontSize: "0.75rem", fontWeight: 700,
            padding: "4px 12px", borderRadius: 999,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {isNueva ? <IconPlus size={14} /> : <IconChefHat size={14} />} {isNueva ? "Nuevo" : "Preparando"}
          </span>
        </div>

        {/* Platillos */}
        <div style={{ background: "#22262c", borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < order.items.length - 1 ? 8 : 0 }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "#FF6B35", color: "white",
                fontWeight: 900, fontSize: "0.875rem",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {item.qty}
              </span>
              <p style={{ fontWeight: 600, fontSize: "0.9375rem", margin: 0, color: "#f0ede8" }}>{item.dishName}</p>
            </div>
          ))}
        </div>

        {/* Acción */}
        {isNueva ? (
          <button 
            disabled={updatingId === order.id}
            onClick={() => tomarOrden(order.id)} 
            style={{
              width: "100%", background: "#3b82f6", color: "white",
              border: "none", padding: "12px", borderRadius: 12,
              fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: updatingId === order.id ? 0.6 : 1,
            }}
          >
            {updatingId === order.id ? "Actualizando..." : <><IconChefHat size={18} /> Tomar orden</>}
          </button>
        ) : (
          <button 
            disabled={updatingId === order.id}
            onClick={() => marcarListo(order.id)} 
            style={{
              width: "100%", background: "#22c55e", color: "white",
              border: "none", padding: "12px", borderRadius: 12,
              fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: updatingId === order.id ? 0.6 : 1,
            }}
          >
            {updatingId === order.id ? "Actualizando..." : <><IconCheck size={18} /> Marcar como listo</>}
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#111214", fontFamily: "'Outfit', sans-serif", color: "#f0ede8" }}>

      {/* Header */}
      <div style={{ background: "#1a1d21", borderBottom: "1px solid #2e3238", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FF6B35", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <IconChefHat size={22} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: 0 }}>Vista Cocina</p>
            <p style={{ fontSize: "0.7rem", color: "#6b7280", margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <IconChefHat size={12} /> {user?.name} · {user?.branch}
            </p>
          </div>
        </div>
        <button onClick={logout} style={{ background: "#2e3238", color: "#f0ede8", border: "none", padding: "7px 14px", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit" }}>
          Salir
        </button>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Contador rápido */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: "#1a1d21", borderRadius: 12, padding: "14px", border: "1px solid #1e3a5f", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#3b82f6", margin: "0 0 2px" }}>{nuevas.length}</p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Nuevas</p>
          </div>
          <div style={{ flex: 1, background: "#1a1d21", borderRadius: 12, padding: "14px", border: "1px solid #3d2e0a", textAlign: "center" }}>
            <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#f59e0b", margin: "0 0 2px" }}>{enPreparacion.length}</p>
            <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: 0 }}>Preparando</p>
          </div>
        </div>

        {/* Nuevas */}
        {nuevas.length > 0 && (
          <>
            <p style={{ fontWeight: 700, color: "#8a8f98", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <IconPlus size={14} /> Nuevas — tomar
            </p>
            {nuevas.map(o => <OrderCard key={o.id} order={o} mode="nueva" />)}
          </>
        )}

        {/* En preparación */}
        {enPreparacion.length > 0 && (
          <>
            <p style={{ fontWeight: 700, color: "#8a8f98", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, marginTop: nuevas.length > 0 ? 8 : 0, display: "flex", alignItems: "center", gap: 6 }}>
              <IconChefHat size={14} /> En preparación
            </p>
            {enPreparacion.map(o => <OrderCard key={o.id} order={o} mode="preparando" />)}
          </>
        )}

        {/* Cola vacía */}
        {orders?.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6b7280" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12, color: "#22c55e" }}>
              <IconCheck size={48} />
            </div>
            <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>Todo al día</p>
            <p style={{ fontSize: "0.875rem" }}>No hay órdenes pendientes</p>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
