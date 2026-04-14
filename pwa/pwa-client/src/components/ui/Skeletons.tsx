"use client";

import type { CSSProperties } from "react";

// ─── Átomo base ──────────────────────────────────────────────────────────────
interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: number | string;
  style?: CSSProperties;
  dark?: boolean;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style, dark = false }: SkeletonProps) {
  const base  = dark ? "#18181b" : "#e4e4e7";
  const shine = dark ? "#27272a" : "#f4f4f5";
  return (
    <>
      <div style={{
        width, height, borderRadius,
        background: `linear-gradient(90deg, ${base} 25%, ${shine} 50%, ${base} 75%)`,
        backgroundSize: "800px 100%",
        animation: "sk-shimmer 1.4s infinite linear",
        ...style,
      }} />
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </>
  );
}

// ─── Card de platillo (menú) ──────────────────────────────────────────────────
export function DishCardSkeleton({ dark = false }: { dark?: boolean }) {
  const card = dark ? "#09090b" : "#ffffff";
  return (
    <div style={{ background: card, borderRadius: 24, overflow: "hidden", border: dark ? "1px solid #ffffff0d" : "1px solid #f4f4f5" }}>
      <Skeleton height={140} borderRadius="0" dark={dark} />
      <div style={{ padding: "14px 16px 16px" }}>
        <Skeleton height={16} width="75%" borderRadius={6} dark={dark} style={{ marginBottom: 8 }} />
        <Skeleton height={12} width="55%" borderRadius={6} dark={dark} style={{ marginBottom: 12 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton height={20} width={60} borderRadius={6} dark={dark} />
          <Skeleton height={34} width={34} borderRadius="50%" dark={dark} />
        </div>
      </div>
    </div>
  );
}

// ─── Grid de menú completo ────────────────────────────────────────────────────
export function MenuSkeleton({ dark = false }: { dark?: boolean }) {
  const bg = dark ? "#09090b" : "#f9fafb";
  return (
    <div style={{ minHeight: "100dvh", background: bg, padding: "0 24px 100px" }}>
      {/* Search bar */}
      <div style={{ padding: "16px 0 12px" }}>
        <Skeleton height={44} borderRadius={12} dark={dark} />
      </div>
      {/* Chips de categorías */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[80, 100, 70, 90, 65].map((w, i) => (
          <Skeleton key={i} width={w} height={32} borderRadius={999} dark={dark} />
        ))}
      </div>
      {/* Grid de cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <DishCardSkeleton key={i} dark={dark} />
        ))}
      </div>
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </div>
  );
}

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div style={{ minHeight: "100dvh", background: "#111214", padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Skeleton height={20} width={140} borderRadius={6} dark style={{ marginBottom: 6 }} />
          <Skeleton height={12} width={100} borderRadius={6} dark />
        </div>
        <Skeleton height={32} width={60} borderRadius={8} dark />
      </div>
      {/* Período tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[70, 90, 80, 100].map((w, i) => <Skeleton key={i} width={w} height={32} borderRadius={999} dark />)}
      </div>
      {/* KPI grid 2x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ background: "#1a1d21", borderRadius: 14, padding: 16 }}>
            <Skeleton height={24} width={32} borderRadius={6} dark style={{ marginBottom: 10 }} />
            <Skeleton height={28} width="70%" borderRadius={6} dark style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="80%" borderRadius={6} dark />
          </div>
        ))}
      </div>
      {/* Gráfica placeholder */}
      <div style={{ background: "#1a1d21", borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <Skeleton height={16} width="50%" borderRadius={6} dark style={{ marginBottom: 6 }} />
        <Skeleton height={12} width="35%" borderRadius={6} dark style={{ marginBottom: 16 }} />
        <Skeleton height={180} borderRadius={10} dark />
      </div>
      {/* Segunda gráfica */}
      <div style={{ background: "#1a1d21", borderRadius: 16, padding: 18 }}>
        <Skeleton height={16} width="45%" borderRadius={6} dark style={{ marginBottom: 16 }} />
        <Skeleton height={160} borderRadius={10} dark />
      </div>
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </div>
  );
}

// ─── Carrito (drawer) ─────────────────────────────────────────────────────────
export function CartSkeleton({ dark = false }: { dark?: boolean }) {
  const bg   = dark ? "#1a1d21" : "#ffffff";
  const item = dark ? "#22262c" : "#f9f5f0";
  return (
    <div style={{ background: bg, padding: "20px 16px" }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ background: item, borderRadius: 14, padding: "12px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <Skeleton width={52} height={52} borderRadius={10} dark={dark} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <Skeleton height={14} width="70%" borderRadius={6} dark={dark} style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="40%" borderRadius={6} dark={dark} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <Skeleton height={18} width={60} borderRadius={6} dark={dark} />
            <Skeleton height={28} width={80} borderRadius={999} dark={dark} />
          </div>
        </div>
      ))}
      {/* Total y botón */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <Skeleton height={16} width={80} borderRadius={6} dark={dark} />
          <Skeleton height={20} width={90} borderRadius={6} dark={dark} />
        </div>
        <Skeleton height={52} borderRadius={14} dark={dark} />
      </div>
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </div>
  );
}

// ─── Lista de órdenes ─────────────────────────────────────────────────────────
export function OrderListSkeleton({ dark = false }: { dark?: boolean }) {
  const bg   = dark ? "#111214" : "#FFF0DC";
  const card = dark ? "#1a1d21" : "#ffffff";
  return (
    <div style={{ background: bg, padding: 16 }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ background: card, borderRadius: 16, padding: "18px 20px", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <Skeleton height={16} width={120} borderRadius={6} dark={dark} style={{ marginBottom: 6 }} />
              <Skeleton height={12} width={90} borderRadius={6} dark={dark} />
            </div>
            <Skeleton width={64} height={64} borderRadius={8} dark={dark} />
          </div>
          <Skeleton height={1} borderRadius={0} dark={dark} style={{ marginBottom: 10 }} />
          {[1, 2].map((j) => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Skeleton height={12} width="60%" borderRadius={6} dark={dark} />
              <Skeleton height={12} width={50} borderRadius={6} dark={dark} />
            </div>
          ))}
          <Skeleton height={1} borderRadius={0} dark={dark} style={{ margin: "10px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Skeleton height={14} width={50} borderRadius={6} dark={dark} />
            <Skeleton height={16} width={70} borderRadius={6} dark={dark} />
          </div>
        </div>
      ))}
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </div>
  );
}

// ─── Staff ────────────────────────────────────────────────────────────────────
export function StaffListSkeleton() {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ background: "#1a1d21", borderRadius: 14, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <Skeleton width={46} height={46} borderRadius="50%" dark />
          <div style={{ flex: 1 }}>
            <Skeleton height={14} width="55%" borderRadius={6} dark style={{ marginBottom: 6 }} />
            <Skeleton height={11} width="35%" borderRadius={999} dark />
          </div>
          <Skeleton height={20} width={60} borderRadius={999} dark />
        </div>
      ))}
      <style>{`@keyframes sk-shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }`}</style>
    </div>
  );
}
