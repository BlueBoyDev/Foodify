import { api } from "./api/axios";
import { 
  SaasKpi, 
  SaasRestaurant, 
  SaasSubscription, 
  SaasRestaurantDetail 
} from "../types/saas";

/**
 * Backend v3.2 mapping for CODEX SaaS Panel
 * Endpoints: /api/v1/admin/...
 */

export async function getSaasKpisApi(period: string = "month"): Promise<SaasKpi> {
  const { data } = await api.get("/admin/dashboard/kpis", { params: { period } });
  // El backend devuelve { data: { ...kpis }, status: 200 }
  return data.data as SaasKpi;
}

export async function getSaasRestaurantsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ items: SaasRestaurant[]; total: number }> {
  const { data } = await api.get("/admin/restaurants", { params });
  const items = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  const total = data.data?.total ?? items.length;
  
  return { 
    items: items.map((r: any) => {
      const pName = r.subscription?.plan?.name ?? r.planName ?? "Básico";
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        ownerEmail: r.owner?.email ?? r.email ?? "—",
        planName: pName,
        plan: pName,
        status: r.status ?? "active",
        createdAt: r.createdAt,
        subscriptionExpiresAt: r.subscription?.expiresAt,
      };
    }),
    total 
  };
}

export async function getSaasRestaurantDetailApi(id: number): Promise<SaasRestaurantDetail> {
  const { data } = await api.get(`/admin/restaurants/${id}`);
  const r = data.data;
  const pName = r.subscription?.plan?.name ?? "Básico";
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    ownerEmail: r.owner?.email ?? r.email ?? "—",
    planName: pName,
    plan: pName,
    status: r.status ?? "active",
    createdAt: r.createdAt,
    address: r.address,
    phone: r.phone,
    totalMenus: r.stats?.totalMenus ?? 0,
    totalDishes: r.stats?.totalDishes ?? 0,
    branchCount: r.branches?.length ?? 1,
  };
}

export async function getSaasSubscriptionsApi(params?: {
  page?: number;
  limit?: number;
}): Promise<{ items: SaasSubscription[]; total: number }> {
  const { data } = await api.get("/admin/subscriptions", { params });
  const items = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  const total = data.data?.total ?? items.length;

  return {
    items: items.map((s: any) => {
      const pName = s.plan?.name || "Básico";
      return {
        id: s.id,
        restaurantId: s.restaurant?.id,
        restaurantName: s.restaurant?.name,
        planName: pName,
        plan: pName,
        status: s.status,
        amount: s.lastPaymentAmount ?? 0,
        currency: "MXN",
        nextPaymentDate: s.expiresAt,
      };
    }),
    total
  };
}

export async function updateSaasSubscriptionApi(id: number, payload: any): Promise<void> {
  await api.patch(`/admin/subscriptions/${id}`, payload);
}

export async function updateSaasSubscriptionStatusApi(id: number, status: string, reason?: string): Promise<void> {
  await api.patch(`/admin/subscriptions/${id}/status`, { status, reason });
}
