export type UserRole = 'restaurant_admin' | 'saas_admin' | 'waiter' | 'chef' | 'cashier';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  hero_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  schedule?: string;
  timezone?: string;
  instagram_url?: string;
  facebook_url?: string;
  twitter_url?: string;
  whatsapp_number?: string;
  dashboard_config?: {
    showSales: boolean;
    showTopDishes: boolean;
    showPeakHours: boolean;
    showCategoryIncome: boolean;
    showDishesSold: boolean;
  };
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  restaurantId: string;
  isActive: boolean;
  hasSchedule: boolean;
  activeDays?: number[]; // 0-6
  startTime?: string;
  endTime?: string;
  allowOutsideSchedule: boolean;
  categories: Category[];
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Lucide icon name
  sortOrder: number;
  dishes: Dish[];
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  prepTimeMin: number;
  images: string[];
  isAvailable: boolean;
  categoryId: string;
  allergens: string[];
  ingredients: Ingredient[];
  soldCount?: number;
}

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  isOptional: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  status: 'available' | 'low' | 'critical' | 'out';
}

export interface Order {
  id: string;
  folio: string;
  type: 'takeout' | 'dine_in';
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  customerName: string;
  customerPhone?: string;
  notes?: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  tableId?: string;
  waiterId?: string;
}

export interface OrderItem {
  id: string;
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  specialNotes?: string;
}
