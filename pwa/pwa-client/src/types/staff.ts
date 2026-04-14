// Roles definidos en Foodify_Guia_Tecnica_Maestra_v2.docx — Parte VII
export type StaffRole =
  | "restaurant_admin"
  | "manager"
  | "waiter"
  | "chef"
  | "cashier";

export type StaffStatus = "active" | "inactive" | "suspended";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  branch: string;
  createdAt: string;      // ISO — fecha de alta
  lastLogin?: string;     // ISO — último acceso
  avatarInitials?: string;
}

export const ROLE_CFG: Record<StaffRole, { label: string; color: string; bg: string; icon: string }> = {
  restaurant_admin: { label: "Administrador", color: "#FF6B35", bg: "#2a1810", icon: "user" },
  manager:          { label: "Gerente",        color: "#3b82f6", bg: "#1e3a5f", icon: "package" },
  waiter:           { label: "Mesero",          color: "#22c55e", bg: "#0d3320", icon: "bell" },
  chef:             { label: "Chef / Cocina",   color: "#f59e0b", bg: "#3d2e0a", icon: "chef" },
  cashier:          { label: "Cajero",          color: "#a78bfa", bg: "#2d1f4e", icon: "dollar" },
};

export const STATUS_CFG: Record<StaffStatus, { label: string; color: string; bg: string }> = {
  active:    { label: "Activo",     color: "#22c55e", bg: "#0d3320" },
  inactive:  { label: "Inactivo",   color: "#6b7280", bg: "#1f2937" },
  suspended: { label: "Suspendido", color: "#ef4444", bg: "#3d1010" },
};
