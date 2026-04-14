import { axiosInstance } from './axios';

export interface CreateOrderPayload {
  type: 'takeout';
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: {
    dishId: number;
    quantity: number;
    specialNotes?: string;
  }[];
}

export const menuApi = {
  getPublicMenu: async (slug: string) => {
    // Requirement: /menu/:slug usually doesn't have /api/v1 prefix in this backend architecture
    // or maybe it does. Let's assume axiosInstance baseURL handles the /api/v1 part.
    // If it's a public endpoint outside api/v1, we might need a separate instance or raw axios.
    // However, the user said: Backend base URL: variable de entorno NEXT_PUBLIC_API_URL
    // and "Todas las respuestas del backend: { "data": <T>, "status": 200 }"
    const response = await axiosInstance.get(`/menu/${slug}`);
    return response.data;
  },

  createOrder: async (payload: CreateOrderPayload) => {
    const response = await axiosInstance.post('/orders', payload);
    return response.data;
  },

  getOrderTracking: async (slug: string, folio: string) => {
    const response = await axiosInstance.get(`/menu/${slug}/order/${folio}`);
    return response.data;
  },
};
