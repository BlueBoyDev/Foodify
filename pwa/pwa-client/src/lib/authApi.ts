import { api } from "./api/axios";
import type { AuthUser } from "@/types/auth";


// Respuesta del backend v3.2 — login devuelve tokens + role directamente (sin objeto user)
interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  planName: string;
  subscriptionStatus: string;
}


function mapRole(r: string): AuthUser["role"] {
  switch (r) {
    case "saas_admin":       return "saas_admin";
    case "restaurant_admin": return "admin";
    case "manager":          return "admin";
    case "waiter":           return "mesero";
    case "chef":             return "cocina";
    case "cashier":          return "mesero";
    default:                 return "admin";
  }
}

export async function loginApi(
  email: string,
  password: string
): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {

  try {
    const { data } = await api.post("/auth/login", { email, password });
    const authData = data.data as LoginResponse;

    // v3.2: login devuelve tokens + role directamente, sin objeto user
    // Obtenemos el perfil completo con /auth/me
    const meRes = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${authData.accessToken}` },
    });
    const me = meRes.data.data;

    const user: AuthUser = {
      id:     String(me.id ?? me.userId ?? me.sub ?? ""),
      name:   String(me.name ?? email.split("@")[0]),
      email:  String(me.email ?? email),
      role:   mapRole(authData.role),
      branch: String(me.restaurant?.name ?? me.restaurantName ?? "Foodify"),
    };

    return { user, accessToken: authData.accessToken, refreshToken: authData.refreshToken };
  } catch (error: unknown) {
    const msg = (error as { response?: { data?: { message?: string } } })
      ?.response?.data?.message;
    throw new Error(msg ?? "Error al iniciar sesión");
  }
}

export async function logoutApi(): Promise<void> {
  try { await api.post("/auth/logout"); } catch { /* ignorar */ }
}

export async function getMeApi(): Promise<AuthUser> {
  const { data } = await api.get("/auth/me");
  const me = data.data;
  return {
    id:     String(me.id ?? me.userId ?? me.sub ?? ""),
    name:   String(me.name ?? ""),
    email:  String(me.email),
    role:   mapRole(me.role),
    branch: String(me.restaurant?.name ?? "Foodify"),
  };
}



