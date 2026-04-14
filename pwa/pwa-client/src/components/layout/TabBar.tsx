"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { IconBag, IconReceipt, IconPhone, IconSun, IconMoon } from "@/components/ui/Icons";

// ─── Rutas donde NO se muestra el TabBar (staff) ──────────────────────────────
const STAFF_ROUTES = ["/login", "/dashboard", "/mesero", "/cocina"];

// ─── Tab Bar ──────────────────────────────────────────────────────────────────
const TABS = [
  { href: "/para-llevar", label: "Para Llevar", Icon: IconBag     },
  { href: "/ordenes",     label: "Órdenes",     Icon: IconReceipt },
  { href: "/contacto",    label: "Contacto",    Icon: IconPhone   },
];

interface TabBarProps {
  pendingOrders?: number;
}

export function TabBar({ pendingOrders = 0 }: TabBarProps) {
  const pathname = usePathname();
  const { dark } = useTheme();

  // No mostrar en rutas de staff
  const isStaff = STAFF_ROUTES.some((r) => pathname.startsWith(r));
  if (isStaff) return null;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: dark ? "#1a1a1a" : "#ffffff",
        borderTop: `1px solid ${dark ? "#2e2e2e" : "#e5e0d8"}`,
        paddingBottom: "env(safe-area-inset-bottom)",
        display: "flex",
      }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active   = pathname.startsWith(href);
        const isOrders = href === "/ordenes";

        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 0 6px",
              textDecoration: "none",
              position: "relative",
            }}
          >
            {active && (
              <span style={{
                position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                width: 52, height: 32, borderRadius: 999,
                background: "rgba(255,107,53,0.15)",
              }} />
            )}

            <span style={{ position: "relative", zIndex: 1 }}>
              <Icon size={22} color={active ? "#FF6B35" : dark ? "#6b7280" : "#9B7B6B"} />
              {isOrders && pendingOrders > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -6,
                  background: "#FF6B35", color: "white",
                  width: 16, height: 16, borderRadius: "50%",
                  fontSize: "0.6rem", fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {pendingOrders}
                </span>
              )}
            </span>

            <span style={{
              fontSize: "0.7rem", marginTop: 2,
              fontWeight: active ? 700 : 500,
              color: active ? "#FF6B35" : dark ? "#6b7280" : "#9B7B6B",
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  const { dark, toggle } = useTheme();

  return (
    <div style={{
      background: "#000000",
      padding: "20px 20px 16px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    }}>
      <div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", margin: 0, lineHeight: 1.1 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "0.875rem", color: "#9B7B6B", margin: "4px 0 0" }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {right}
        <button onClick={toggle} style={{
          width: 40, height: 40, borderRadius: "50%",
          background: dark ? "#2e2e2e" : "#1a1a1a",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {dark ? <IconSun size={18} color="#facc15" /> : <IconMoon size={18} color="#94a3b8" />}
        </button>
      </div>
    </div>
  );
}
