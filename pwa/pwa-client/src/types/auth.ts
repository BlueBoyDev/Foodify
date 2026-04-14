export type UserRole = "saas_admin" | "admin" | "restaurant_admin" | "manager" | "waiter" | "chef" | "cashier" | "mesero" | "cocinero" | "cocina" | "guest";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  role: UserRole;
  branch?: string;   // PWA branch name
  restaurant?: { id: string | number; name: string; slug?: string }; // Backend shape
  restaurantId?: string | number;
  slug?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  user: AuthUser;
}
