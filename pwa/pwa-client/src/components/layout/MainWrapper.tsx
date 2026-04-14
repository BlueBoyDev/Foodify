"use client";

import { usePathname } from "next/navigation";

const STAFF_ROUTES = ["/login", "/dashboard", "/mesero", "/cocina"];

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStaff  = STAFF_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <main style={{
      minHeight: "100dvh",
      paddingBottom: isStaff ? 0 : "calc(64px + env(safe-area-inset-bottom))",
    }}>
      {children}
    </main>
  );
}
