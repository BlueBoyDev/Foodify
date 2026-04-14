import { UserRole } from "./auth";

export interface SaasKpi {
  totalRestaurants: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalOrders: number;
  growthPercentage: number;
}

export interface SaasRestaurant {
  id: number;
  name: string;
  slug: string;
  ownerEmail: string;
  planName: string;
  plan?: string; // Alias para compatibilidad con UI antigua
  status: "active" | "inactive" | "pending";
  createdAt: string;
  subscriptionExpiresAt?: string;
}

export interface SaasSubscription {
  id: number;
  restaurantId: number;
  restaurantName: string;
  planName: string;
  plan?: string; // Alias
  status: string;
  amount: number;
  currency: string;
  nextPaymentDate: string;
}

export interface SaasRestaurantDetail extends SaasRestaurant {
  address?: string;
  phone?: string;
  totalMenus: number;
  totalDishes: number;
  branchCount: number;
}
