import { api } from "./api/axios";
import type { StaffMember, StaffRole, StaffStatus } from "../types/staff";

function mapRole(r: string): StaffRole {
  switch (r) {
    case "restaurant_admin": return "restaurant_admin";
    case "manager":          return "manager";
    case "waiter":           return "waiter";
    case "chef":             return "chef";
    case "cashier":          return "cashier";
    default:                 return "waiter";
  }
}

function mapStatus(isActive: unknown): StaffStatus {
  return isActive === false ? "inactive" : "active";
}

function mapMember(u: Record<string, unknown>): StaffMember {
  // El backend v3.2 suele devolver fullName o full_name en lugar de name.
  // El interceptor del backend a veces duplica los campos en ambos formatos.
  const name = String(
    u.fullName ?? 
    u.full_name ?? 
    u.waiterName ?? // Caso especial de órdenes mapeadas
    u.name ?? 
    "Sin nombre"
  );
  
  return {
    id:             String(u.id),
    name,
    email:          String(u.email ?? ""),
    phone:          String(u.phone ?? u.phoneNumber ?? "—"),
    role:           mapRole(String(u.role ?? "waiter")),
    status:         mapStatus(u.isActive),
    branch:         String((u.restaurant as Record<string, unknown>)?.name ?? u.branch ?? "Principal"),
    createdAt:      String(u.createdAt ?? new Date().toISOString()),
    lastLogin:      u.lastLoginAt ? String(u.lastLoginAt) : (u.lastLogin ? String(u.lastLogin) : undefined),
    avatarInitials: name !== "Sin nombre" 
      ? name.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      : "??",
  };
}

export async function getStaffApi(): Promise<StaffMember[]> {
  try {
    const { data } = await api.get("/users");
    const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
    return list.map(mapMember);
  } catch (e) {
    console.error("Error fetching staff:", e);
    throw e;
  }
}

export async function createStaffApi(payload: {
  name: string; email: string; phone: string;
  role: StaffRole; password: string;
}): Promise<StaffMember> {
  // Map name to fullName for backend compatibility if needed, 
  // but keeping signature consistent with StaffMember
  const { data } = await api.post("/users", {
    ...payload,
    fullName: payload.name // Backend v3.2 controller might still use this field
  });
  return mapMember(data.data);
}

export async function updateStaffApi(id: string, payload: Partial<{
  name: string; email: string; phone: string; role: StaffRole;
}>): Promise<StaffMember> {
  const { data } = await api.put(`/users/${id}`, {
    ...payload,
    fullName: payload.name
  });
  return mapMember(data.data);
}

export async function updateStaffStatusApi(id: string, status: StaffStatus): Promise<void> {
  await api.put(`/users/${id}`, { isActive: status === "active" });
}

export async function deleteStaffApi(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}