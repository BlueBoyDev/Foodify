// RUTA: src/types/feedback.ts

export interface CustomerFeedbackRequest {
  restaurantId: number
  orderId?: number           // si viene de una orden
  orderFolio?: string        // folio visible "#0023"
  rating: number             // 1-5 estrellas
  comment?: string           // comentario libre
  categories: string[]       // categorías de feedback
  customerName?: string      // opcional, anónimo por default
}

export interface FeedbackCategory {
  id: string
  label: string
}

export const FEEDBACK_CATEGORIES: FeedbackCategory[] = [
  { id: 'food_quality',   label: 'Calidad de la comida' },
  { id: 'speed',          label: 'Velocidad del servicio' },
  { id: 'presentation',   label: 'Presentación' },
  { id: 'price_value',    label: 'Precio / Calidad' },
  { id: 'app_experience', label: 'Experiencia en el menú' },
  { id: 'other',          label: 'Otro' }
]

export interface CustomerFeedbackResponse {
  id: number
  message: string
  createdAt: string
}

export interface RestaurantReview {
  id: number
  rating: number
  comment: string | null
  categories: string[]
  customerName: string | null
  orderId: number | null
  orderFolio: string | null
  restaurantReply?: string | null
  repliedAt?: string | null
  createdAt: string
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: { [key: number]: number }
  categoryBreakdown: { [key: string]: number }
}
