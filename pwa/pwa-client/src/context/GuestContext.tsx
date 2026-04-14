"use client";

import { createContext, useContext, useState, useEffect } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface GuestContextValue {
  sessionId: string | null;
  isReady: boolean;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const GuestContext = createContext<GuestContextValue>({
  sessionId: null,
  isReady: false,
});

export function useGuest() {
  return useContext(GuestContext);
}

// ─── Generador de ID único ────────────────────────────────────────────────────
function generateSessionId(): string {
  // Formato: guest_<timestamp>_<random>
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GuestProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady]     = useState(false);

  useEffect(() => {
    // Intenta recuperar sesión existente
    let id = localStorage.getItem("foodify_guest_session");

    // Si no existe, crea una nueva y la persiste
    if (!id) {
      id = generateSessionId();
      localStorage.setItem("foodify_guest_session", id);
    }

    // Usar un pequeño delay para evitar advertencias de cascading render síncrono
    const timer = setTimeout(() => {
      setSessionId(id);
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <GuestContext.Provider value={{ sessionId, isReady }}>
      {children}
    </GuestContext.Provider>
  );
}
