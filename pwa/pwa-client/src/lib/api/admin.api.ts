import { axiosInstance } from './axios';

export const adminApi = {
  // Dashboard
  getSalesStats: async (period: string) => {
    const response = await axiosInstance.get(`/reports/sales`, { params: { period } });
    return response.data;
  },
  getTopDishes: async (limit: number = 5) => {
    const response = await axiosInstance.get(`/reports/dishes/top`, { params: { limit } });
    return response.data;
  },
  getPeakHours: async () => {
    const response = await axiosInstance.get(`/reports/peak-hours`);
    return response.data;
  },
  getCategoryIncome: async () => {
    const response = await axiosInstance.get(`/reports/category-income`);
    return response.data;
  },
  getDishesByMenu: async (menuId?: string, period?: string) => {
    const response = await axiosInstance.get(`/reports/dishes/sold`, { params: { menuId, period } });
    return response.data;
  },

  // Menu Management
  getMenus: async () => {
    const response = await axiosInstance.get('/menus');
    return response.data;
  },
  updateMenuStatus: async (id: string, status: boolean) => {
    const response = await axiosInstance.patch(`/menus/${id}/status`, { isActive: status });
    return response.data;
  },
  getCategories: async (menuId: string) => {
    const response = await axiosInstance.get(`/menus/${menuId}/categories`);
    return response.data;
  },
  sortCategories: async (menuId: string, categoryId: string, payload: any) => {
    const response = await axiosInstance.patch(`/menus/${menuId}/categories/${categoryId}/sort`, payload);
    return response.data;
  },
  getDishes: async (params?: any) => {
    const response = await axiosInstance.get('/dishes', { params });
    return response.data;
  },
  updateDishAvailability: async (id: string, available: boolean) => {
    const response = await axiosInstance.patch(`/dishes/${id}/availability`, { is_available: available });
    return response.data;
  },

  // Inventory
  getInventoryItems: async () => {
    const response = await axiosInstance.get('/inventory/items');
    return response.data;
  },
  getInventoryLots: async (params?: any) => {
    const response = await axiosInstance.get('/inventory/lots', { params });
    return response.data;
  },

  // Staff
  getStaff: async () => {
    const response = await axiosInstance.get('/staff');
    return response.data;
  },

  // Orders
  getOrders: async (status?: string) => {
    const response = await axiosInstance.get('/orders', { params: { status } });
    return response.data;
  },
  updateOrderStatus: async (id: string, status: string) => {
    const response = await axiosInstance.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Tables
  getTables: async () => {
    const response = await axiosInstance.get('/tables');
    return response.data;
  },
  updateTablesConfig: async (count: number) => {
    const response = await axiosInstance.post('/tables/config', { count });
    return response.data;
  },

  // Config
  getRestaurant: async (id: string) => {
    const response = await axiosInstance.get(`/restaurants/${id}`);
    return response.data;
  },
  updateRestaurant: async (id: string, payload: any) => {
    const response = await axiosInstance.put(`/restaurants/${id}`, payload);
    return response.data;
  },
  updateRestaurantSettings: async (id: string, settings: any) => {
    const response = await axiosInstance.patch(`/restaurants/${id}/settings`, settings);
    return response.data;
  },
};
