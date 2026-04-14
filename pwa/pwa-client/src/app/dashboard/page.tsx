"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { DashboardSkeleton } from "@/components/ui/Skeletons";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { ErrorAlert } from "@/components/ErrorAlert";
import type { Dish } from "@/types/menu";
import type { Ingredient } from "@/types/inventory";
import { getAlertLevel } from "@/types/inventory";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { RestaurantSwitchModal } from "@/components/RestaurantSwitchModal";
import styles from "./dashboard.module.css";
import {
  IconUtensils,
  IconClipboard,
  IconPackage,
  IconUsers,
  IconBarChart,
  IconDollarSign,
  IconReceipt,
  IconTrendingUp,
  IconChefHat,
  IconAlertCircle,
  IconCheck,
} from "@/components/ui/Icons";
import {
  getSalesReportApi, getTopDishesApi, getRestaurantDashboardApi,
  type ReportPeriod
} from "@/lib/reportsApi";
import { getDishesApi } from "@/lib/menuApi";
import { getInventoryItemsApi } from "@/lib/inventoryApi";
import Link from "next/link";

function useRoleGuard(allowed: string[]) {
  const { user, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && (!user || !allowed.includes(user.role)))
      window.location.href = "/login";
  }, [isLoading, user, allowed]);
  return { user, isLoading };
}

function buildProfitData(salesData: { ventas: number }[]) {
  return salesData.slice(-4).map((day, i) => {
    const rawCost = day.ventas * 0.4;
    return {
      label: `Día ${i + 1}`,
      ingresos: day.ventas,
      costos: rawCost,
      rentabilidad: day.ventas - rawCost,
    };
  });
}

const PIE_COLORS = ["#FF6B35", "#6366f1", "#22c55e", "#f59e0b", "#ec4899"];
type Period = "hoy" | "semana" | "mes" | "trimestre";
const PERIOD_LABELS: Record<Period, string> = {
  hoy: "Hoy", semana: "Esta semana", mes: "Este mes", trimestre: "Este trimestre",
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #eee", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}>
      <p style={{ fontSize: "0.72rem", color: "#666", margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontSize: "0.85rem", fontWeight: 700, color: "#E8673A", margin: "2px 0" }}>
          {p.name}: ${p.value.toLocaleString("es-MX")}
        </p>
      ))}
    </div>
  );
}

const MODULES = [
  { icon: <IconUtensils size={24} />,   label: "Menú",       sub: "Gestiona platillos",  href: "/admin/menu",       color: "#E8673A" },
  { icon: <IconClipboard size={24} />,  label: "Pedidos",    sub: "Órdenes activas",      href: "/admin/orders",     color: "#6366f1" },
  { icon: <IconPackage size={24} />,    label: "Inventario", sub: "Stock y lotes",        href: "/admin/inventory",  color: "#22c55e" },
  { icon: <IconUsers size={24} />,      label: "Staff",      sub: "Personal",             href: "/admin/staff",      color: "#f59e0b" },
  { icon: <IconBarChart size={24} />,   label: "Reportes",   sub: "KPIs y estadísticas",  href: "/admin/dashboard",  color: "#a78bfa" },
];

function mapPeriod(p: Period): ReportPeriod {
  if (p === "hoy") return "today";
  if (p === "semana") return "week";
  if (p === "mes") return "month";
  if (p === "trimestre") return "quarter";
  return "year";
}

export default function DashboardPage() {
  const { user, isLoading } = useRoleGuard(["admin", "restaurant_admin", "manager"]);
  const { logout } = useAuth();
  
  const [period, setPeriod] = useState<Period>("mes");
  const [salesData, setSalesData] = useState<{ label: string; ventas: number; ordenes: number }[]>([]);
  const [topDishes, setTopDishes] = useState<{ name: string; value: number }[]>([]);
  const [kpis, setKpis] = useState({
    totalVentas: 0,
    validOrdersCount: 0,
    ticketPromedio: 0,
    enCocina: 0
  });
  
  const [dataLoading, setDataLoading] = useState(true);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const { data: dishesData, loading: dishesLoading, error: dishesError, refetch: refetchDishes } = useFetchWithState<Dish[]>("/dishes", getDishesApi, 15000);
  const { data: ingredientsData } = useFetchWithState<Ingredient[]>("/inventory/items", getInventoryItemsApi, 15000);
  
  const alertIngredients = useMemo(() => ingredientsData?.filter(i => getAlertLevel(i) !== "ok") ?? [], [ingredientsData]);

  useEffect(() => {
    if (!user || isLoading) return;

    const fetchData = async () => {
      try {
        const rid = user?.restaurantId ? String(user.restaurantId) : "";
        const [sales, top, dash] = await Promise.all([
          getSalesReportApi({ period: mapPeriod(period) }).catch(() => []),
          getTopDishesApi({ limit: 5, period: mapPeriod(period) }).catch(() => []),
          getRestaurantDashboardApi().catch(() => ({ salesToday: 0, activeOrders: 0, topDishes: [], stockAlerts: 0 }))
        ]);

        setSalesData(sales);
        setTopDishes(top.map(d => ({
          name: d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name,
          value: d.value
        })));

        const totalV = sales.reduce((acc, s) => acc + s.ventas, 0);
        const totalO = sales.reduce((acc, s) => acc + s.ordenes, 0);

        setKpis({
          totalVentas: totalV,
          validOrdersCount: totalO,
          ticketPromedio: totalO > 0 ? Math.round(totalV / totalO) : 0,
          enCocina: dash.activeOrders
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [user, isLoading, period]);

  const profitData = useMemo(() => buildProfitData(salesData), [salesData]);

  if (dishesLoading || dataLoading || isLoading || !user) return <DashboardSkeleton />;
  if (dishesError) return <ErrorAlert message={dishesError} onRetry={refetchDishes} />;

  const { totalVentas, ticketPromedio, enCocina, validOrdersCount } = kpis;
  
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Logo variant="foodify" className="text-white" />
          <div className="ml-4">
            <p className={styles.headerTitle}>Foodify Admin</p>
            <div className={styles.branchSelector} onClick={() => setShowSwitchModal(true)}>
              <p className={styles.headerSub}>{user.name} · {user.branch || "Sucursal"}</p>
              <span className={styles.switchBadge}>Cambiar</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <RestaurantSwitchModal isOpen={showSwitchModal} onClose={() => setShowSwitchModal(false)} />
          <Button variant="secondary" size="sm" onClick={logout}>Salir</Button>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.sectionHead}>
          <h1 className={styles.pageTitle}>Resumen</h1>
          <div className={styles.periodPicker}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button key={p} className={`${styles.periodBtn} ${period === p ? styles.periodActive : ""}`} onClick={() => setPeriod(p)}>{PERIOD_LABELS[p]}</button>
            ))}
          </div>
        </div>

        <div className={styles.kpiGrid}>
          <div className={styles.kpiCard}><p className={styles.kpiValue}>${totalVentas.toLocaleString()}</p><p className={styles.kpiLabel}>Ventas</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiValue}>${ticketPromedio}</p><p className={styles.kpiLabel}>Ticket Prom.</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiValue}>{enCocina}</p><p className={styles.kpiLabel}>En Cocina</p></div>
          <div className={styles.kpiCard}><p className={styles.kpiValue}>{validOrdersCount}</p><p className={styles.kpiLabel}>Órdenes</p></div>
        </div>

        <div className={styles.chartsRow}>
          <div className={styles.chartCard} style={{ flex: 2 }}>
            <p className={styles.chartTitle}>Ventas Diarias</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" /><YAxis /><Tooltip content={<CustomTooltip />} /><Bar dataKey="ventas" fill="#E8673A" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>Top Platillos</p>
            <ResponsiveContainer width="100%" height={150}><PieChart><Pie data={topDishes} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={30}>{topDishes.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
          </div>
        </div>

        <div className={styles.modulesGrid}>
          {MODULES.map((m) => (
            <Link key={m.label} href={m.href} className={styles.moduleCard} style={{ borderColor: `${m.color}20` }}>
              <div style={{ color: m.color }}>{m.icon}</div>
              <p className={styles.moduleLabel}>{m.label}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
