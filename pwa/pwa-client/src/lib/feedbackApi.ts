// RUTA: src/lib/feedbackApi.ts
import axios from 'axios';
import { 
  CustomerFeedbackRequest, 
  CustomerFeedbackResponse, 
  RestaurantReview, 
  ReviewStats 
} from '@/types/feedback';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Usamos una instancia limpia para feedback público (sin auth)
const publicApi = axios.create({
  baseURL: API_BASE_URL
});

/**
 * Crea una reseña desde la PWA pública
 */
export const createFeedback = async (slug: string, data: CustomerFeedbackRequest): Promise<CustomerFeedbackResponse> => {
  const response = await publicApi.post(`/menu/${slug}/feedback`, data);
  return response.data;
};

/**
 * Obtiene las reseñas públicas para el menú
 */
export const fetchPublicReviews = async (slug: string, limit: number = 5): Promise<RestaurantReview[]> => {
  const response = await publicApi.get(`/menu/${slug}/reviews`, { params: { limit } });
  return response.data;
};

/**
 * Obtiene todas las reseñas del restaurante (para el Admin)
 */
export const fetchRestaurantReviews = async (restaurantId: number, params: any): Promise<{ data: RestaurantReview[], total: number }> => {
  // Aquí usamos el axios con interceptores de auth si existiera, 
  // pero por ahora simulamos con axios directo.
  const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/reviews`, {
    params,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Obtiene estadísticas de reseñas del restaurante
 */
export const fetchReviewStats = async (restaurantId: number, period?: string): Promise<ReviewStats> => {
  const response = await axios.get(`${API_BASE_URL}/restaurants/${restaurantId}/reviews/stats`, {
    params: { period },
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data;
};

/**
 * Responde a una reseña (Admin)
 */
export const replyToReview = async (reviewId: number, reply: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/reviews/${reviewId}/reply`, { reply }, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
};
