"use client";

import React from "react";
import styles from "./AdminLayout.module.css";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

interface AdminLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  backHref?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AdminLayout({
  title,
  subtitle,
  backHref = "/dashboard",
  actions,
  children,
}: AdminLayoutProps) {
  const { logout } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.left}>
          <button
            className={styles.backBtn}
            onClick={() => (window.location.href = backHref)}
            aria-label="Volver"
          >
            ←
          </button>
          <div>
            <p className={styles.title}>{title}</p>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.actions}>
          {actions}
          <Button variant="ghost" size="sm" onClick={logout}>
            Salir
          </Button>
        </div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
