"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  BarChart3, 
  ShoppingBag, 
  Users, 
  Package, 
  Calendar,
  ChevronDown,
  TrendingUp,
  Clock,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { KpiCard } from "@/components/ui/KpiCard";
import { SalesChart } from "@/components/admin/charts/SalesChart";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip, 
  Legend 
} from "recharts";
import { 
  getSalesReportApi, 
  getTopDishesApi, 
  getRestaurantDashboardApi,
  getPeakHoursApi,
  type ReportPeriod
} from "@/lib/reportsApi";
import { getInventoryItemsApi } from "@/lib/inventoryApi";
import { useAuthStore } from "@/store/authStore";
import { useFetchWithState } from "@/lib/useFetchWithState";

const COLORS = ["#E8673A", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function mapPeriod(p: string): ReportPeriod {
  if (p === "Hoy") return "today";
  if (p === "Semana") return "week";
  if (p === "Mes") return "month";
  return "year";
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState("Mes");
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const reportPeriod = mapPeriod(period);

  // Memoize fetchers para evitar re-creación en cada render
  const salesFetcher = useMemo(() => () => getSalesReportApi({ period: reportPeriod }), [reportPeriod]);
  const topDishesFetcher = useMemo(() => () => getTopDishesApi({ period: reportPeriod }), [reportPeriod]);
  const dashFetcher = useMemo(() => () => getRestaurantDashboardApi(), []);

  const { data: salesData, loading: salesLoading } = useFetchWithState("sales", salesFetcher, 15000);
  const { data: topDishesData, loading: topDishesLoading } = useFetchWithState("top-dishes", topDishesFetcher, 15000);
  const { data: peakData, loading: peakLoading } = useFetchWithState("peak-hours", getPeakHoursApi, 15000);
  const { data: dashboard, loading: dashLoading } = useFetchWithState("dash-kpis", dashFetcher, 15000);
  const { data: inventory, loading: invLoading } = useFetchWithState("inventory", getInventoryItemsApi, 15000);

  // Transformaciones de datos
  const sales = (salesData || []).map(s => ({ name: s.label, sales: s.ventas }));
  const topDishes = (topDishesData || []).map(d => ({ name: d.name, value: d.value }));
  const peak = (peakData || []).map(p => ({ range: p.hour, val: p.ordenes }));
  const lowStockCount = (inventory || []).filter(i => i.currentStock <= i.minStock).length;

  if (!isMounted) {
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-8">
        <div className="h-12 w-48 bg-gray-200 dark:bg-zinc-800 rounded-xl mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-zinc-800 rounded-2xl" />)}
        </div>
        <div className="h-[400px] bg-gray-200 dark:bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 font-outfit">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-primary dark:text-white">
            Panel de Control 👋
          </h1>
          <p className="text-gray-400 text-sm">Resumen del rendimiento: {period}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white dark:bg-zinc-900 border p-1 rounded-xl shadow-sm">
            {["Hoy", "Semana", "Mes"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                  period === p 
                    ? "bg-foodify-orange text-white shadow-md shadow-foodify-orange/20" 
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Ventas" 
          value={formatCurrency(dashboard?.salesToday || 0)} 
          icon={BarChart3} 
          trend={{ value: '12%', isUp: true }}
          subtitle="período actual"
        />
        <KpiCard 
          title="Activos" 
          value={String(dashboard?.activeOrders || 0)} 
          icon={ShoppingBag} 
          trend={{ value: 'En cocina', isUp: true }}
          className="bg-foodify-orange-light/50 dark:bg-foodify-orange/10"
        />
        <KpiCard 
          title="Ocupación" 
          value="8" 
          icon={Users} 
          subtitle="de 12 mesas"
        />
        <KpiCard 
          title="Stock Alertas" 
          value={String(lowStockCount)} 
          icon={Package} 
          className="border-orange-100 dark:border-orange-900/30"
          subtitle="Ver inventario →"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-black text-lg mb-1">Ventas por período</h3>
              <p className="text-xs text-gray-400">Ingresos acumulados en {period}</p>
            </div>
            
            <div className="flex bg-gray-50 dark:bg-zinc-900 p-1 rounded-lg">
              {(['bar', 'line', 'area'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-md transition-all capitalize",
                    chartType === t ? "bg-white dark:bg-zinc-800 text-foodify-orange shadow-sm" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <SalesChart type={chartType} data={sales} />
        </div>

        {/* Top Dishes Pie Chart */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border">
          <div className="mb-8">
            <h3 className="font-black text-lg mb-1">Top platillos</h3>
            <p className="text-xs text-gray-400">Distribución de ventas</p>
          </div>

          <div className="h-[240px]">
             {topDishes.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topDishes}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topDishes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-gray-300">
                  <Layers className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-xs">Sin datos</p>
               </div>
             )}
          </div>
          
          <div className="mt-4 space-y-2">
            {topDishes.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-text-secondary font-medium truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-foodify-orange" />
            <h3 className="font-black text-lg">Horas pico</h3>
          </div>
          
          <div className="space-y-4">
            {peak.length > 0 ? peak.slice(0, 3).map((p) => (
              <div key={p.range}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Rango: {p.range}</span>
                  <span className="text-foodify-orange">{p.val} pedidos</span>
                </div>
                <div className="w-full h-2 bg-gray-50 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-foodify-orange rounded-full" 
                    style={{ width: `${Math.min((p.val / 10) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            )) : (
              <p className="text-xs text-gray-400">Cargando estadísticas de demanda...</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-lg">Rendimiento</h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300" />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase font-bold text-gray-400 border-b dark:border-border">
                <tr>
                  <th className="pb-3 text-left">Producto</th>
                  <th className="pb-3 text-right">Ventas</th>
                  <th className="pb-3 text-right">Popularidad</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-border">
                {topDishes.length > 0 ? topDishes.map((m) => (
                  <tr key={m.name} className="group">
                    <td className="py-4 font-bold group-hover:text-foodify-orange transition-colors">{m.name}</td>
                    <td className="py-4 font-black text-right">{m.value}</td>
                    <td className="py-4 text-right">
                       <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded text-[10px] font-bold">
                          Top {m.value}
                       </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-gray-400 italic">No hay datos suficientes</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
