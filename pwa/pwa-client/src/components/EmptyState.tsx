// src/components/EmptyState.tsx
import { FC, ReactNode } from "react";
import { IconPackage } from "@/components/ui/Icons";

interface Props {
  title: string;
  description?: string;
  /** Icono profesional (SVG) para mostrar. Por defecto es IconPackage */
  icon?: ReactNode;
}

export const EmptyState: FC<Props> = ({ title, description, icon }) => (
  <section style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 24px",
    background: "#1a1d21",
    borderRadius: "16px",
    border: "2px dashed #2e3238",
    textAlign: "center",
    margin: "16px 0",
    color: "#f0ede8"
  }}>
    <div style={{ marginBottom: "16px", opacity: 0.8, color: "var(--color-primary, #FF6B35)" }}>
      {icon ? icon : <IconPackage size={56} />}
    </div>
    <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px" }}>{title}</h2>
    {description && (
      <p style={{ color: "#8a8f98", fontSize: "0.9375rem", margin: 0, maxWidth: "400px", lineHeight: 1.5 }}>
        {description}
      </p>
    )}
  </section>
);
