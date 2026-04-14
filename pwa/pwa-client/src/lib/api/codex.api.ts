import { axiosInstance } from './axios';

export const codexApi = {
  // Global Dashboard
  getGlobalStats: async (period: string) => {
    const response = await axiosInstance.get('/codex/stats', { params: { period } });
    return response.data;
  },

  // Restaurants Management
  getRestaurants: async (params?: any) => {
    const response = await axiosInstance.get('/admin/restaurants', { params });
    return response.data;
  },
  registerRestaurant: async (payload: any) => {
    const response = await axiosInstance.post('/admin/restaurants/register', payload);
    return response.data;
  },
  getRestaurantDetail: async (id: string) => {
    const response = await axiosInstance.get(`/admin/restaurants/${id}`);
    return response.data;
  },

  // Subscriptions & Payments
  getSubscriptions: async (params?: any) => {
    const response = await axiosInstance.get('/admin/subscriptions', { params });
    return response.data;
  },
  registerManualPayment: async (subscriptionId: string, payload: any) => {
    const response = await axiosInstance.post(`/admin/subscriptions/${subscriptionId}/payment`, payload);
    return response.data;
  },
  getPayments: async (params?: any) => {
    const response = await axiosInstance.get('/admin/payments', { params });
    return response.data;
  },
};
