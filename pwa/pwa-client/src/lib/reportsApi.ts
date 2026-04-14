import { api } from "./api/axios";

export type ReportPeriod = "today" | "week" | "month" | "quarter" | "year";

// ─── Ventas por día ───────────────────────────────────────────────────────────
export async function getSalesReportApi(params?: {
  period?: ReportPeriod;
  start?: string;
  end?: string;
}): Promise<{
  label: string; ventas: number; ordenes: number;
}[]> {
  const { data } = await api.get("/reports/sales", { params });
  const list = Array.isArray(data.data?.byDay) ? data.data.byDay : 
               Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    label:   String(d.label ?? d.date ?? ""),
    ventas:  Number(d.ventas ?? d.total ?? 0),
    ordenes: Number(d.ordenes ?? d.orders ?? 0),
  }));
}

// ─── Top platillos ────────────────────────────────────────────────────────────
export async function getTopDishesApi(params?: {
  limit?: number;
  period?: ReportPeriod;
  start?: string;
  end?: string;
}): Promise<{
  name: string; value: number; income: number;
}[]> {
  const { data } = await api.get("/reports/dishes/top", { params: { limit: 10, ...params } });
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    name:   String(d.name ?? d.dishName ?? ""),
    value:  Number(d.value ?? d.soldCount ?? d.quantity ?? 0),
    income: Number(d.income ?? d.total ?? 0),
  }));
}

// ─── Horas pico ──────────────────────────────────────────────────────────────
export async function getPeakHoursApi(): Promise<{
  hour: string; ordenes: number;
}[]> {
  const { data } = await api.get("/reports/peak-hours");
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    hour:    String(d.hour).includes(':') ? String(d.hour) : `${String(d.hour ?? "0").padStart(2, "0")}:00`,
    ordenes: Number(d.ordenes ?? d.orders ?? d.count ?? 0),
  }));
}

// ─── Ingresos por categoría ───────────────────────────────────────────────────
export async function getCategoryIncomeApi(params?: {
  period?: ReportPeriod;
  start?: string;
  end?: string;
}): Promise<{
  name: string; value: number;
}[]> {
  const { data } = await api.get("/reports/category-income", { params });
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: Record<string, unknown>) => ({
    name:  String(d.categoryName ?? d.name ?? ""),
    value: Number(d.income ?? d.total ?? 0),
  }));
}

// ─── Desempeño del personal ──────────────────────────────────────────────────
export async function getStaffPerformanceApi(params?: {
  period?: ReportPeriod;
  userId?: number;
  start?: string;
  end?: string;
}): Promise<{
  worker: string;
  orders: number;
  revenue: number;
}[]> {
  const { data } = await api.get("/reports/staff", { params });
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: any) => ({
    worker:  String(d.userName ?? d.name ?? d.worker ?? ""),
    orders:  Number(d.orderCount ?? d.orders ?? 0),
    revenue: Number(d.totalRevenue ?? d.revenue ?? 0),
  }));
}

// ─── Desempeño de cocina ──────────────────────────────────────────────────────
export async function getKitchenPerformanceApi(params?: {
  period?: ReportPeriod;
  start?: string;
  end?: string;
}): Promise<{
  label: string;
  avgTimeMin: number;
  orderCount: number;
}[]> {
  const { data } = await api.get("/reports/kitchen/performance", { params });
  const list = Array.isArray(data.data) ? data.data : [];
  return list.map((d: any) => ({
    label:      String(d.label ?? d.date ?? ""),
    avgTimeMin: Number(d.avgTimeMin ?? d.avg_time ?? 0),
    orderCount: Number(d.orderCount ?? d.count ?? 0),
  }));
}

// ─── KPIs del restaurante ─────────────────────────────────────────────────────
export async function getRestaurantDashboardApi(): Promise<{
  salesToday: number;
  activeOrders: number;
  topDishes: { name: string; count: number }[];
  stockAlerts: number;
}> {
  try {
    const { data } = await api.get("/reports/dashboard");
    const d = data.data ?? data ?? {};
    return {
      salesToday:   Number(d.salesToday ?? d.sales_today ?? 0),
      activeOrders: Number(d.activeOrders ?? d.active_orders ?? 0),
      topDishes:    Array.isArray(d.topDishes) ? d.topDishes : [],
      stockAlerts:  Number(d.stockAlerts ?? d.stock_alerts ?? 0),
    };
  } catch {
    return { salesToday: 0, activeOrders: 0, topDishes: [], stockAlerts: 0 };
  }
}

// ─── Exportar reporte ─────────────────────────────────────────────────────────
export async function exportReportApi(
  type: "sales" | "dishes" | "inventory", 
  format: "csv" | "xlsx" = "xlsx",
  params?: { restaurantId?: string; period?: string }
): Promise<void> {
  const response = await api.get("/reports/export", {
    params: { type, format, ...params },
    responseType: "blob",
  });
  
  // Axios con responseType: 'blob' ya devuelve un objeto Blob en response.data
  const url  = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", `reporte-${type}-${new Date().toISOString().slice(0, 10)}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}