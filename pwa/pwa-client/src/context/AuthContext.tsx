"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser, AuthSession } from "@/types/auth";
import { logoutApi } from "@/lib/authApi";
import { getRestaurantDetailsApi, getOwnedRestaurantsApi } from "@/lib/restaurantApi";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (session: AuthSession & { accessToken?: string; refreshToken?: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, isLoading: true,
  login: () => {}, logout: () => {},
});

export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehidratar sesión desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("foodify_session");
      if (raw) {
        const session = JSON.parse(raw) as AuthSession;
        // Normalizar nombres de campos
        const u = session.user;
        if (u) {
          u.name   = u.name   || "Usuario";
          u.branch = u.branch || u.restaurant?.name || "Sucursal";
          u.slug   = u.slug   || u.restaurant?.slug || "";
          u.slug   = u.slug   || u.restaurant?.slug || "";
        }
        setUser(u);
        // Soportar tanto "token" (legacy mock) como "accessToken" (backend real)
        setToken(session.accessToken ?? session.token ?? null);
      }
    } catch {
      localStorage.removeItem("foodify_session");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Auto-resolución de slug para sesiones antiguas
  useEffect(() => {
    async function resolveSlug() {
      if (!user || user.slug || !user.restaurantId) return;

      try {
        // El slug se resolverá via API o vendrá en la sesión

        // Intento 3: Consulta directa
        const rest = await getRestaurantDetailsApi(String(user.restaurantId));
        if (rest.slug) {
          updateUserSlug(rest.slug);
          return;
        }


        // Intento 3: Buscar en la lista de dueños
        const list = await getOwnedRestaurantsApi();
        const found = list.find(r => String(r.id) === String(user.restaurantId));
        if (found?.slug) {
          updateUserSlug(found.slug);
        }
      } catch (e) {
        console.warn("Failed to auto-resolve restaurant slug:", e);
      }
    }

    function updateUserSlug(slug: string) {
      if (!user) return;
      const updated = { ...user, slug };
      setUser(updated);
      const raw = localStorage.getItem("foodify_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.user = updated;
        localStorage.setItem("foodify_session", JSON.stringify(session));
      }
    }

    resolveSlug();
  }, [user?.id, user?.restaurantId, user?.slug]);

  const login = (session: AuthSession & { accessToken?: string; refreshToken?: string }) => {
    // Normalizar
    const u = session.user;
    if (u) {
      u.name   = u.name   || "Usuario";
      u.branch = u.branch || u.restaurant?.name || "Sucursal";
      u.slug   = u.slug   || u.restaurant?.slug || "";
      u.slug   = u.slug   || u.restaurant?.slug || "";
    }
    
    // Guardar en localStorage
    const stored = {
      user:         u,
      token:        session.token ?? session.accessToken,
      accessToken:  session.accessToken ?? session.token,
      refreshToken: session.refreshToken ?? null,
    };
    localStorage.setItem("foodify_session", JSON.stringify(stored));
    setUser(u);
    setToken(stored.accessToken ?? null);
  };

  const logout = async () => {
    // Llamar al backend para invalidar el refresh token
    await logoutApi();
    localStorage.removeItem("foodify_session");
    setUser(null);
    setToken(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
