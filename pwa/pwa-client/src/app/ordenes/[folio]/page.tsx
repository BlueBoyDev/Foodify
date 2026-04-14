"use client";

import { useEffect, useState, useCallback } from "react";
import { getOrderByFolioApi } from "@/lib/ordersApi";
import { RESTAURANT_SLUG } from "@/lib/menuApi";
import { useParams } from "next/navigation";
import type { Order, OrderStatus } from "@/types/orders";
import {
  IconPackage,
  IconCheck,
  IconClock,
  IconChefHat,
  IconArrowLeft,
  IconClipboard,
  IconUtensils,
  IconSearch,
  IconX,
} from "@/components/ui/Icons";

// ─── Configuración de estados simplificada para comensales (T38)
const STATUS_STEPS: { status: OrderStatus; label: string; icon: any; desc: string }[] = [
  { status: "nuevo",          label: "Pedido Recibido",    icon: IconClipboard, desc: "Tu orden fue recibida y está en espera" },
  { status: "en_preparacion", label: "En Proceso",         icon: IconChefHat,   desc: "Tu pedido está siendo preparado por nuestro equipo" },
  { status: "entregado",      label: "Entregado",          icon: IconCheck,     desc: "¡Que lo disfrutes! Gracias por tu preferencia" },
];

const STATUS_ORDER: Record<OrderStatus, number> = {
  nuevo: 0, confirmado: 0, en_preparacion: 1, listo: 1, entregado: 2, cancelado: -1,
};

// ─── Helpers
function readOrders(): Order[] {
  try {
    const raw = localStorage.getItem("foodify_guest_orders");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function fmtElapsed(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1)  return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  return `Hace ${Math.floor(mins / 60)}h ${mins % 60}min`;
}

function getEstimatedMins(status: OrderStatus, createdAt: string): number | null {
  const elapsed = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (status === "nuevo")          return Math.max(0, 5  - elapsed);
  if (status === "en_preparacion") return Math.max(0, 20 - elapsed);
  return null;
}

// ─── Skeleton (T41)
function TrackingSkeleton() {
  return (
    <div style={{ minHeight: "100dvh", background: "#FFF0DC", fontFamily: "'Outfit', sans-serif", padding: 20 }}>
      <style>{`@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
      {[{ w: "60%", h: 24 }, { w: "40%", h: 16 }, { w: "100%", h: 120, mt: 24 }, { w: "100%", h: 80 }, { w: "100%", h: 80 }, { w: "100%", h: 80 }].map((s, i) => (
        <div key={i} style={{
          width: s.w, height: s.h, borderRadius: 10, marginTop: s.mt ?? 10,
          background: "linear-gradient(90deg,#f0e4d0 25%,#ffe8c8 50%,#f0e4d0 75%)",
          backgroundSize: "800px 100%", animation: "shimmer 1.4s infinite linear",
        }} />
      ))}
    </div>
  );
}

// ─── Paso individual del timeline
function TimelineStep({
  step, index, currentIndex, isLast,
}: {
  step: typeof STATUS_STEPS[0]; index: number; currentIndex: number; isLast: boolean;
}) {
  const isDone    = index < currentIndex;
  const isActive  = index === currentIndex;
  const isPending = index > currentIndex;

  const dotColor  = isDone ? "#22c55e" : isActive ? "#FF6B35" : "#d4b896";
  const lineColor = isDone ? "#22c55e" : "#e8d5c0";
  const textColor = isPending ? "#9B7B6B" : "#2C1810";

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
      {/* Línea vertical + dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
        {/* Dot */}
        <div style={{
          width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
          background: isActive ? "#FF6B35" : isDone ? "#22c55e" : "#f0e4d0",
          border: `2px solid ${dotColor}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: isActive ? "1rem" : "0.875rem",
          transition: "all 0.4s ease",
          boxShadow: isActive ? "0 0 0 6px #FF6B3520" : "none",
          animation: isActive ? "pulse-ring 2s infinite" : "none",
        }}>
          {isDone ? <IconCheck size={16} color="white" /> : <step.icon size={isActive ? 18 : 16} color={isActive ? "white" : "#9B7B6B"} />}
        </div>
        {/* Línea hacia abajo */}
        {!isLast && (
          <div style={{ width: 2, flex: 1, minHeight: 28, background: lineColor, marginTop: 4, transition: "background 0.4s ease" }} />
        )}
      </div>

      {/* Contenido */}
      <div style={{ paddingBottom: isLast ? 0 : 24, flex: 1 }}>
        <p style={{
          fontWeight: isActive ? 800 : isDone ? 700 : 500,
          fontSize: isActive ? "1rem" : "0.9rem",
          color: textColor, margin: "4px 0 2px",
          transition: "all 0.4s",
        }}>
          {step.label}
        </p>
        {(isActive || isDone) && (
          <p style={{ fontSize: "0.75rem", color: isActive ? "#2C1810" : "#9B7B6B", margin: 0 }}>
            {step.desc}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL
export default function OrderTrackingPage() {
  const params             = useParams<{ folio: string }>();
  const folio              = params.folio?.toUpperCase();
  const [order, setOrder]  = useState<Order | null | undefined>(undefined); // undefined=cargando
  const [, setTick] = useState(0);

  // Leer orden — polling cada 5s (T38)
  const loadOrder = useCallback(async () => {
    // 1. Buscar en localStorage primero (instantáneo)
    const all   = readOrders();
    const local = all.find((o) => o.folio?.toUpperCase() === folio || o.id === folio);
    if (local) setOrder(local);

    // 2. Consultar backend para estado actualizado
    try {
      const remote = await getOrderByFolioApi(RESTAURANT_SLUG, folio ?? "");
      if (remote) {
        setOrder(remote);
        // Actualizar localStorage con estado real del backend
        const updated = all.map((o) =>
          (o.folio?.toUpperCase() === folio || o.id === folio) ? { ...o, status: remote.status } : o
        );
        localStorage.setItem("foodify_guest_orders", JSON.stringify(updated));
      } else if (!local) {
        setOrder(null);
      }
    } catch {
      if (!local) setOrder(null);
    }
  }, [folio]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  loadOrder();
  const pollInterval = setInterval(loadOrder, 5000);
  const tickInterval = setInterval(() => setTick((t) => t + 1), 30000);
  return () => { clearInterval(pollInterval); clearInterval(tickInterval); };
}, [loadOrder]);

  // ── Loading
  if (order === undefined) return <TrackingSkeleton />;

  // ── No encontrada
  if (order === null) {
    return (
      <div style={{ minHeight: "100dvh", background: "#FFF0DC", fontFamily: "'Outfit', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <div style={{ marginBottom: 12, color: "#9B7B6B" }}>
          <IconSearch size={48} />
        </div>
        <p style={{ fontWeight: 800, fontSize: "1.125rem", color: "#2C1810", marginBottom: 8 }}>Orden no encontrada</p>
        <p style={{ fontSize: "0.875rem", color: "#9B7B6B", marginBottom: 24 }}>
          No encontramos la orden <strong>#{folio}</strong>.<br />Verifica el folio e intenta de nuevo.
        </p>
        <button onClick={() => window.location.href = "/ordenes"}
          style={{ background: "#FF6B35", color: "white", border: "none", padding: "12px 28px", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", fontFamily: "inherit" }}>
          Ver mis órdenes
        </button>
      </div>
    );
  }

  const currentIndex  = order.status === "cancelado" ? -1 : (STATUS_ORDER[order.status] ?? 0);
  const currentStep   = STATUS_STEPS[currentIndex] ?? null;
  const isCancelled   = order.status === "cancelado";
  const isDelivered   = order.status === "entregado";
  const estimatedMins = getEstimatedMins(order.status, order.createdAt);
  const total         = order.items.reduce((s, it) => s + it.unitPrice * it.qty, 0);

  return (
    <div style={{ minHeight: "100dvh", background: "#FFF0DC", fontFamily: "'Outfit', sans-serif", color: "#2C1810" }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { box-shadow: 0 0 0 0 #FF6B3540; }
          70%  { box-shadow: 0 0 0 10px #FF6B3500; }
          100% { box-shadow: 0 0 0 0 #FF6B3500; }
        }
        @keyframes bounce-in {
          0%   { transform: scale(0.7); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position:  400px 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ background: "#FF6B35", padding: "16px 20px 24px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => window.location.href = "/ordenes"}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconArrowLeft size={16} />
          </button>
          <p style={{ fontWeight: 800, fontSize: "1rem", margin: 0 }}>Seguimiento de orden</p>
        </div>

        {/* Folio + estado hero */}
        <div style={{ textAlign: "center", animation: "slide-up 0.4s ease both" }}>
          <p style={{ fontSize: "0.75rem", opacity: 0.8, margin: "0 0 4px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Folio #{order.folio ?? order.id.slice(-6).toUpperCase()}
          </p>

          {isCancelled ? (
            <div style={{ animation: "bounce-in 0.5s ease both" }}>
              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
                <IconX size={48} />
              </div>
              <p style={{ fontWeight: 900, fontSize: "1.375rem", margin: 0 }}>Orden cancelada</p>
            </div>
          ) : isDelivered ? (
            <div style={{ animation: "bounce-in 0.5s ease both" }}>
              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
                <IconCheck size={48} />
              </div>
              <p style={{ fontWeight: 900, fontSize: "1.375rem", margin: 0 }}>¡Entregada!</p>
              <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: "4px 0 0" }}>Que lo disfrutes · {fmtElapsed(order.createdAt)}</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px", animation: "bounce-in 0.5s ease both" }}>
                <currentStep.icon size={48} />
              </div>
              <p style={{ fontWeight: 900, fontSize: "1.375rem", margin: "0 0 4px" }}>
                {currentStep?.label}
              </p>
              {estimatedMins !== null && estimatedMins > 0 && (
                <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: 0 }}>
                  ⏱ <IconClock size={12} style={{ display: "inline", verticalAlign: "middle", marginTop: -2 }} /> Tiempo estimado: ~{estimatedMins} min
                </p>
              )}
              {estimatedMins === 0 && (
                <p style={{ fontSize: "0.8rem", opacity: 0.85, margin: 0 }}>⚡ Muy pronto</p>
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ padding: "20px 20px 40px" }}>

        {/* ── Progress bar (solo si no cancelado) ── */}
        {!isCancelled && (
          <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {/* Barra de progreso */}
            <div style={{ background: "#f0e4d0", borderRadius: 999, height: 6, marginBottom: 20, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999, background: "#FF6B35",
                width: `${((currentIndex + 1) / STATUS_STEPS.length) * 100}%`,
                transition: "width 0.6s ease",
              }} />
            </div>

            {/* Timeline pasos */}
            {STATUS_STEPS.map((step, i) => (
              <TimelineStep
                key={step.status}
                step={step}
                index={i}
                currentIndex={currentIndex}
                isLast={i === STATUS_STEPS.length - 1}
              />
            ))}
          </div>
        )}

        {/* ── Banner cancelado ── */}
        {isCancelled && (
          <div style={{ background: "#fde8e8", borderRadius: 16, padding: "16px", marginBottom: 16, border: "1px solid #fca5a5", textAlign: "center" }}>
            <p style={{ fontWeight: 700, color: "#dc2626", margin: "0 0 4px" }}>Esta orden fue cancelada</p>
            <p style={{ fontSize: "0.8rem", color: "#9B7B6B", margin: 0 }}>{fmtElapsed(order.createdAt)}</p>
          </div>
        )}

        {/* ── Detalle de items ── */}
        <div style={{ background: "white", borderRadius: 16, padding: "20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <p style={{ fontWeight: 800, fontSize: "0.9375rem", margin: "0 0 14px", color: "#2C1810", display: "flex", alignItems: "center", gap: 6 }}>
            <IconClipboard size={16} /> Detalle del pedido
          </p>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, marginBottom: 10, borderBottom: i < order.items.length - 1 ? "1px solid #f0e4d0" : "none" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: "0 0 2px", color: "#2C1810" }}>{item.dishName}</p>
                <p style={{ fontSize: "0.72rem", color: "#9B7B6B", margin: 0 }}>× {item.qty} · ${item.unitPrice} c/u</p>
              </div>
              <p style={{ fontWeight: 700, color: "#FF6B35", margin: 0, fontSize: "0.9rem" }}>
                ${(item.unitPrice * item.qty).toLocaleString("es-MX")}
              </p>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: "2px solid #f0e4d0" }}>
            <p style={{ fontWeight: 800, color: "#2C1810", margin: 0 }}>Total</p>
            <p style={{ fontWeight: 900, color: "#FF6B35", margin: 0, fontSize: "1.125rem" }}>
              ${total.toLocaleString("es-MX")}
            </p>
          </div>
        </div>

        {/* ── Info de la orden ── */}
        <div style={{ background: "white", borderRadius: 16, padding: "16px 20px", marginBottom: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Folio",    value: `#${order.folio ?? order.id.slice(-6).toUpperCase()}` },
              { label: "Hora",     value: fmtTime(order.createdAt)       },
              { label: "Mesa",     value: order.tableId ?? "Para llevar" },
              { label: "Pedido",   value: fmtElapsed(order.createdAt)    },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: "0.68rem", color: "#9B7B6B", margin: "0 0 2px", fontWeight: 600, textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#2C1810", margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Polling indicator (T38 — actualización automática) ── */}
        {!isDelivered && !isCancelled && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", animation: "pulse-ring 2s infinite" }} />
            <p style={{ fontSize: "0.7rem", color: "#9B7B6B", margin: 0 }}>Actualizando automáticamente cada 5s</p>
          </div>
        )}

        {/* ── Botón de acción ── */}
        {isDelivered ? (
          <button onClick={() => window.location.href = "/para-llevar"}
            style={{ width: "100%", background: "#FF6B35", color: "white", border: "none", padding: "14px", borderRadius: 14, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IconUtensils size={18} /> Pedir de nuevo
          </button>
        ) : (
          <button onClick={() => window.location.href = "/ordenes"}
            style={{ width: "100%", background: "white", color: "#FF6B35", border: "2px solid #FF6B35", padding: "13px", borderRadius: 14, fontWeight: 700, fontSize: "0.9375rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <IconArrowLeft size={18} /> Ver todas mis órdenes
          </button>
        )}
      </div>
    </div>
  );
}
