"use client";

import { createContext, useContext, useState } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggle: () => {},
});

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark((d) => !d) }}>
      {children}
    </ThemeContext.Provider>
  );
}
