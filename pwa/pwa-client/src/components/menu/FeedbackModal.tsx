// RUTA: src/components/menu/FeedbackModal.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  IconX, 
  IconCheckCircle, 
  IconStar 
} from "@/components/ui/Icons";
import { 
  FEEDBACK_CATEGORIES, 
  CustomerFeedbackRequest 
} from "@/types/feedback";
import { createFeedback } from "@/lib/feedbackApi";

interface FeedbackModalProps {
  restaurantId: number;
  restaurantName: string;
  orderId?: number;
  orderFolio?: string;
  initialRating?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FeedbackModal({
  restaurantId,
  restaurantName,
  orderId,
  orderFolio,
  initialRating = 0,
  onClose,
  onSuccess,
}: FeedbackModalProps) {
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(initialRating);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Textos descriptivos por rating
  const ratingTexts: Record<number, string> = {
    0: "¿Cómo estuvo?",
    1: "Muy mala experiencia",
    2: "Mala experiencia",
    3: "Experiencia regular",
    4: "¡Buena experiencia!",
    5: "¡Excelente experiencia!",
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const payload: CustomerFeedbackRequest = {
        restaurantId,
        orderId,
        orderFolio,
        rating,
        comment: comment.trim() || undefined,
        categories: selectedCategories,
        customerName: isAnonymous ? undefined : (customerName.trim() || "Anónimo"),
      };
      
      // El slug lo obtenemos del contexto o de la URL si estuviéramos en una ruta dinámica
      // Por ahora usamos un placeholder o lo pasamos por props
      await createFeedback("slug-placeholder", payload);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al enviar feedback:", error);
      alert("No se pudo enviar la reseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (catId: string) => {
    setSelectedCategories(prev => 
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  useEffect(() => {
    if (rating === 5) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [rating]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-[#1a1a1a] w-full max-w-md rounded-t-[32px] sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti Simulator (CSS only for now) */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i} 
                className="absolute top-[-20px] w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FF6B35', '#FCD34D', '#22c55e', '#3b82f6'][Math.floor(Math.random() * 4)],
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Header */}
        <div className="relative p-6 pb-2 text-center border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <IconX size={24} />
          </button>
          
          <div className="mx-auto w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-3">
             <span className="text-2xl">🍴</span>
          </div>
          
          <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Califica tu experiencia
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            en <span className="font-semibold text-gray-700 dark:text-gray-300">{restaurantName}</span>
          </p>
          
          {orderFolio && (
             <p className="mt-1 text-xs text-gray-400 font-medium tracking-wide">
               PEDIDO {orderFolio}
             </p>
          )}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* PASO 1: Estrellas */}
          <div className="mb-8 text-center">
            <div className="flex justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`transition-all duration-300 transform ${rating >= star ? 'scale-110' : 'scale-100'}`}
                >
                  <IconStar 
                    size={48} 
                    color={rating >= star ? "#FCD34D" : "#E5E7EB"}
                    fill={rating >= star ? "#FCD34D" : "none"}
                  />
                </button>
              ))}
            </div>
            <p className={`text-lg font-bold transition-all duration-300 ${
              rating === 1 ? 'text-red-500' : 
              rating === 2 ? 'text-orange-500' : 
              rating === 3 ? 'text-yellow-500' : 
              rating >= 4 ? 'text-green-500' : 'text-gray-400'
            }`}>
              {ratingTexts[rating]}
            </p>
          </div>

          {rating > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {/* PASO 2: Categorías */}
              <div className="mb-6">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                  {rating >= 4 ? "¿Qué aspectos destacarías?" : "¿Qué podríamos mejorar?"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {FEEDBACK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`flex items-center justify-center p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        selectedCategories.includes(cat.id)
                          ? 'border-[#FF6B35] bg-[#FF6B35] text-white shadow-lg shadow-orange-200 dark:shadow-none'
                          : 'border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-orange-200'
                      }`}
                    >
                      {selectedCategories.includes(cat.id) && (
                        <IconCheckCircle size={16} className="mr-2" />
                      )}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PASO 3: Comentario */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Comentario <span className="text-gray-400 font-normal">(opcional)</span>
                  </p>
                  <span className="text-xs text-gray-400">{comment.length}/500</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder={rating <= 2 ? "¿Qué podría mejorar el restaurante?" : "Cuéntanos más sobre tu experiencia..."}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 transition-all resize-none min-h-[100px]"
                />
              </div>

              {/* PASO 4: Nombre / Anónimo */}
              <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Publicar de forma anónima</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isAnonymous} 
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#FF6B35]"></div>
                  </label>
                </div>
                
                {!isAnonymous && (
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="¿Cómo quieres aparecer?"
                    className="w-full bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-orange-500 animate-in slide-in-from-top-2"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="p-6 pt-0">
          <button
            onClick={handleSend}
            disabled={rating === 0 || loading}
            className={`w-full py-4 rounded-2xl font-extrabold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
              rating === 0 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-[#FF6B35] hover:bg-[#ff7d4d] shadow-xl shadow-orange-200 dark:shadow-none'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar reseña'
            )}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full mt-3 py-3 text-gray-400 font-bold hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .animate-confetti {
          animation-name: confetti;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
