// RUTA: src/components/menu/QuickRating.tsx
"use client";

import { useState } from "react";
import { IconStar } from "@/components/ui/Icons";
import { createFeedback } from "@/lib/feedbackApi";

interface QuickRatingProps {
  restaurantId: number;
  orderId?: number;
  orderFolio?: string;
  onComplete: () => void;
  onExpand: () => void; // Para abrir el modal completo
}

export default function QuickRating({
  restaurantId,
  orderId,
  orderFolio,
  onComplete,
  onExpand,
}: QuickRatingProps) {
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickRate = async (value: number) => {
    setRating(value);
    setLoading(true);
    try {
      // Envío rápido solo con el rating
      await createFeedback("slug-placeholder", {
        restaurantId,
        orderId,
        orderFolio,
        rating: value,
        categories: [],
      });
      setSent(true);
    } catch (error) {
       console.error("Error en calificación rápida:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xl shadow-orange-100/50 dark:shadow-none animate-in slide-in-from-bottom duration-700">
      {!sent ? (
        <>
          <h4 className="text-gray-900 dark:text-gray-100 font-extrabold text-lg mb-1 leading-tight">
            ¿Cómo estuvo tu pedido?
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">
            Tu opinión ayuda al restaurante a mejorar
          </p>

          <div className="flex justify-center gap-3 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                disabled={loading}
                onClick={() => handleQuickRate(star)}
                className={`transition-all duration-300 transform active:scale-90 ${loading ? 'opacity-50' : 'hover:scale-110'}`}
              >
                <IconStar 
                  size={36} 
                  color={rating >= star ? "#FCD34D" : "#E5E7EB"}
                  fill={rating >= star ? "#FCD34D" : "none"}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onComplete}
              className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Omitir
            </button>
            <button
              onClick={onExpand}
              className="flex-1 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-all"
            >
              Dejar reseña completa
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-2 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-green-500 text-2xl">✨</span>
          </div>
          <p className="text-gray-900 dark:text-gray-100 font-bold mb-1">¡Gracias por calificar!</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5">¿Quieres agregar un comentario detallado?</p>
          
          <div className="flex flex-col gap-2">
            <button
              onClick={onExpand}
              className="w-full py-3 bg-[#FF6B35] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-orange-200 dark:shadow-none hover:bg-[#ff7d4d] transition-all"
            >
              Sí, agregar comentario
            </button>
            <button
              onClick={onComplete}
              className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              No, gracias
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
