"use client";

import { OrderListSkeleton } from "@/components/ui/Skeletons";

import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { PageHeader } from "@/components/layout/TabBar";
import { useGuestOrders } from "@/lib/useGuestOrders";
import { QRCode } from "@/components/ui/QRCode";
import {
  IconBox,
  IconX,
  IconPackage,
  IconCheck,
  IconClock,
  IconAlertCircle,
  IconUser,
  IconBuilding,
  IconCalendar,
} from "@/components/ui/Icons";
import type { Order, OrderStatus } from "@/types/orders";

// ─── Badge de estado ──────────────────────────────────────────────────────────
const STATUS_MAP: Record<OrderStatus, { label: string; bg: string; color: string; icon: string }> = {
  nuevo:          { label: "En Orden",  bg: "#dbeafe", color: "#3b82f6", icon: "" },
  confirmado:      { label: "Confirmado", bg: "#dbeafe", color: "#3b82f6", icon: "" },
  en_preparacion: { label: "En Cocina", bg: "#fef3c7", color: "#d97706", icon: "" },
  listo:          { label: "Listo",     bg: "#dcfce7", color: "#16a34a", icon: "" },
  entregado:      { label: "Entregado", bg: "#f3f4f6", color: "#6b7280", icon: "" },
  cancelado:      { label: "Cancelado", bg: "#fee2e2", color: "#ef4444", icon: " " },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_MAP[status];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      fontSize: "0.75rem", fontWeight: 700,
      padding: "4px 10px", borderRadius: 999,
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Dialog: confirmar cancelación ───────────────────────────────────────────
function ConfirmCancelDialog({ onConfirm, onClose }: { onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="anim-fade-in" style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
    }}>
      <div className="anim-fade-up" style={{
        background: "#ffffff", borderRadius: 24,
        padding: "32px 24px", width: "100%", maxWidth: 380, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: "#fee2e2",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px",
        }}>
          <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1a1a1a", marginBottom: 10 }}>
          ¿Cancelar Orden?
        </h3>
        <p style={{ color: "#6b7280", fontSize: "0.9375rem", lineHeight: 1.6, marginBottom: 28 }}>
          Esta acción no se puede deshacer. ¿Estás seguro de que deseas cancelar esta orden?
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onClose} style={{
            flex: 1, background: "#f3f4f6", color: "#1a1a1a",
            border: "none", padding: "14px", borderRadius: 999,
            fontWeight: 700, cursor: "pointer", fontSize: "0.9375rem", fontFamily: "inherit",
          }}>No, mantener</button>
          <button onClick={onConfirm} style={{
            flex: 1, background: "#ef4444", color: "white",
            border: "none", padding: "14px", borderRadius: 999,
            fontWeight: 700, cursor: "pointer", fontSize: "0.9375rem", fontFamily: "inherit",
          }}>Sí, cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: detalle de orden ──────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onCancel, dark }: {
  order: Order; onClose: () => void; onCancel: () => void; dark: boolean;
}) {
  const [countdown, setCountdown] = useState(274);
  const [showConfirm, setShowConfirm] = useState(false);

  const bg     = dark ? "#1e1e1e" : "#ffffff";
  const mutedC = dark ? "#6b7280" : "#6b7280";
  const cardBg = dark ? "#2a2a2a" : "#f9fafb";
  const text   = dark ? "#f0ede8" : "#2C1810";
  const total  = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const canCancel = order.status === "nuevo" || order.status === "en_preparacion";

  useEffect(() => {
    if (!canCancel) return;
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [canCancel]);

  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return (
      d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) +
      ", " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <>
      <div className="anim-fade-in" style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }} onClick={onClose}>
        <div className="anim-slide-up" style={{
          background: bg, borderRadius: "24px 24px 0 0",
          width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto",
        }} onClick={(e) => e.stopPropagation()}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: text }}>Detalles de Orden</h2>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: dark ? "#2e2e2e" : "#f3f4f6",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconX size={14} color={mutedC} />
            </button>
          </div>

          <div style={{ padding: "16px 24px 40px" }}>
            {/* QR */}
            <div style={{ background: cardBg, borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <QRCode size={140} />
              </div>
              <p style={{ color: mutedC, fontSize: "0.875rem" }}>Código: ORDER-{order.folio}</p>
            </div>

            {/* Info */}
            <div style={{ background: cardBg, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontWeight: 800, color: text }}>Orden #{order.folio}</p>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[
                  { icon: <IconCalendar size={12} />, label: "Fecha y Hora",  value: fmtDate(order.createdAt) },
                  { icon: <IconUser size={12} />,     label: "Atendido por",  value: order.attendedBy ?? "—" },
                  { icon: <IconBuilding size={12} />, label: "Sucursal",      value: order.branch ?? "—" },
                  { icon: <IconClock size={12} />,    label: "Estado Actual", value: STATUS_MAP[order.status].label },
                ].map(({ icon, label, value }) => (
                  <div key={label}>
                    <p style={{ fontSize: "0.72rem", color: "#FF6B35", fontWeight: 600, marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      {icon} {label}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: text, fontWeight: 500, lineHeight: 1.4 }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Productos */}
            <p style={{ fontWeight: 700, color: text, marginBottom: 10 }}>Productos</p>
            {order.items.map((item, i) => (
              <div key={i} style={{
                background: cardBg, borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "#FF6B35", color: "white",
                    fontWeight: 800, fontSize: "0.8rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{item.qty}</span>
                  <div>
                    <p style={{ fontWeight: 600, color: text, fontSize: "0.9375rem" }}>{item.dishName}</p>
                    <p style={{ color: "#FF6B35", fontSize: "0.8rem" }}>${item.unitPrice} c/u</p>
                  </div>
                </div>
                <p style={{ fontWeight: 700, color: text }}>${item.unitPrice * item.qty}</p>
              </div>
            ))}

            {/* Total */}
            <div style={{
              background: dark ? "#1f2a1f" : "#fff5eb",
              borderRadius: 12, padding: "14px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginTop: 4, marginBottom: 16,
            }}>
              <span style={{ fontWeight: 700, color: text }}>Total:</span>
              <span style={{ fontWeight: 900, color: "#FF6B35", fontSize: "1.25rem" }}>${total}</span>
            </div>

            {/* Cancelar */}
            {canCancel && countdown > 0 && (
              <div style={{
                background: dark ? "#2a2a18" : "#fefce8",
                border: "1px solid #fbbf24", borderRadius: 14,
                padding: "14px 16px", marginBottom: 12,
              }}>
                <p style={{ color: dark ? "#fbbf24" : "#92400e", fontSize: "0.875rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <IconClock size={14} /> Tiempo restante para cancelar: <strong>{mm}:{ss}</strong>
                </p>
                <button onClick={() => setShowConfirm(true)} style={{
                  width: "100%", background: "#ef4444", color: "white",
                  border: "none", padding: "14px", borderRadius: 12,
                  fontWeight: 700, cursor: "pointer", fontSize: "0.9375rem", fontFamily: "inherit",
                }}>Cancelar Orden</button>
              </div>
            )}

            <button onClick={onClose} style={{
              width: "100%", background: dark ? "#2e2e2e" : "#f3f4f6",
              color: text, border: "none", padding: "14px", borderRadius: 14,
              fontWeight: 700, cursor: "pointer", fontSize: "0.9375rem", fontFamily: "inherit",
            }}>Cerrar</button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmCancelDialog
          onConfirm={() => { onCancel(); setShowConfirm(false); onClose(); }}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

// ─── Card de orden ────────────────────────────────────────────────────────────
function OrderCard({ order, onTap, dark }: { order: Order; onTap: () => void; dark: boolean }) {
  const isCancelled = order.status === "cancelado";
  const bg     = isCancelled ? (dark ? "#2a1a1a" : "#fff5f5") : (dark ? "#1e1e1e" : "#ffffff");
  const mutedC = dark ? "#6b7280" : "#9B7B6B";
  const total  = order.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const text   = dark ? "#f0ede8" : "#2C1810";

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) +
      ", " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div onClick={onTap} style={{
      background: bg, borderRadius: 16, padding: "18px 20px", marginBottom: 12, cursor: "pointer",
      border: isCancelled ? "1px solid #fecaca" : "none",
      boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ fontWeight: 800, color: text, fontSize: "0.9375rem" }}>Orden #{order.folio.slice(-6)}</p>
            <StatusBadge status={order.status} />
          </div>
          <p style={{ color: mutedC, fontSize: "0.8rem" }}>{fmtDate(order.createdAt)}</p>
        </div>
        <QRCode size={64} />
      </div>

      <div style={{ height: 1, background: dark ? "#2e2e2e" : "#f3f4f6", marginBottom: 12 }} />

      {order.items.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: mutedC, fontSize: "0.875rem" }}>
            <strong style={{ color: "#FF6B35" }}>{item.qty}x</strong>{"  "}{item.dishName}
          </span>
          <span style={{ color: text, fontSize: "0.875rem", fontWeight: 600 }}>${item.unitPrice * item.qty}</span>
        </div>
      ))}

      <div style={{ height: 1, background: dark ? "#2e2e2e" : "#f3f4f6", margin: "12px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: text, fontWeight: 600 }}>Total:</span>
        <span style={{ color: "#FF6B35", fontWeight: 800, fontSize: "1rem" }}>${total}</span>
      </div>

      {(order.status === "nuevo" || order.status === "en_preparacion" || order.status === "listo") && (
        <button
          onClick={(e) => { e.stopPropagation(); window.location.href = `/ordenes/${order.folio ?? order.id}`; }}
          style={{
            width: "100%", marginTop: 12,
            background: "#FF6B35", color: "white", border: "none",
            padding: "10px", borderRadius: 10, fontWeight: 700,
            fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
           Seguir orden en tiempo real
        </button>
      )}
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function OrdenesPage() {
  const { dark } = useTheme();
  const { myOrders, cancelOrder, isReady } = useGuestOrders();
  const [tab, setTab]       = useState<"proceso" | "entregadas">("proceso");
  const [selected, setSelected] = useState<Order | null>(null);

  const bg     = dark ? "#121212" : "#FFF0DC";
  const cardBg = dark ? "#1a1a1a" : "#ffffff";
  const mutedC = dark ? "#6b7280" : "#9B7B6B";
  const tipBg  = dark ? "#1a2a1a" : "#f0fdf4";
  const text   = dark ? "#f0ede8" : "#2C1810";

  const proceso    = myOrders.filter(o => o.status === "nuevo" || o.status === "en_preparacion" || o.status === "listo");
  const entregadas = myOrders.filter(o => o.status === "entregado" || o.status === "cancelado");
  const displayed  = tab === "proceso" ? proceso : entregadas;

  // Pantalla de carga mientras localStorage hidrata
  if (!isReady) {
    return (
      <div style={{ minHeight: "100dvh", background: bg }}>
        <PageHeader title="Mis Órdenes" subtitle="Rastrea tus pedidos en tiempo real" />
        <OrderListSkeleton dark={dark} />
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: "100dvh" }}>
      <PageHeader title="Mis Órdenes" subtitle="Rastrea tus pedidos en tiempo real" />

      <div style={{ padding: "16px 16px 0" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          {([
            { key: "proceso",    label: `En Proceso (${proceso.length})`,    icon: <IconPackage size={16} /> },
            { key: "entregadas", label: `Entregadas (${entregadas.length})`, icon: <IconCheck size={16} /> },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "14px", borderRadius: 999, border: "none", cursor: "pointer",
              background: tab === key ? "#FF6B35" : cardBg,
              color:      tab === key ? "white"    : mutedC,
              fontWeight: 700, fontSize: "0.875rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: dark ? "none" : "0 1px 8px rgba(44,24,16,0.06)",
              fontFamily: "inherit",
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: mutedC }}>
            <div style={{ marginBottom: 12, opacity: 0.4, display: "flex", justifyContent: "center" }}>
              <IconBox size={64} />
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>
              {myOrders.length === 0 ? "Aún no has hecho ningún pedido" : "Sin órdenes en esta sección"}
            </p>
            <p style={{ fontSize: "0.8rem" }}>
              {myOrders.length === 0 ? "Ve al menú y haz tu primer pedido" : ""}
            </p>
          </div>
        ) : (
          displayed.map((order) => (
            <div key={order.id} className="anim-fade-up">
              <OrderCard order={order} onTap={() => setSelected(order)} dark={dark} />
            </div>
          ))
        )}

        {/* Tip */}
        {tab === "proceso" && proceso.length > 0 && (
          <div style={{ background: tipBg, borderRadius: 14, padding: "14px 16px", marginTop: 4 }}>
            <p style={{ color: dark ? "#86efac" : "#166534", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 6 }}>
              <IconAlertCircle size={14} /> <strong>Tip:</strong> Escanea el código QR al recoger tu orden para marcarla como entregada.
            </p>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onCancel={() => { cancelOrder(selected.id); setSelected(null); }}
          dark={dark}
        />
      )}
    </div>
  );
}


