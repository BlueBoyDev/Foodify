import React from 'react';
import { UtensilsCrossed, Clock, Plus, Minus } from 'lucide-react';
import { Dish } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/stores/useCartStore';

interface DishCardProps {
  dish: Dish;
}

export const DishCard: React.FC<DishCardProps> = ({ dish }) => {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.dishId === Number(dish.id));

  const handleAdd = () => {
    addItem({
      dishId: Number(dish.id),
      name: dish.name,
      price: dish.price,
      quantity: 1,
      image_url: dish.images[0],
    });
  };

  const handleUpdateQty = (delta: number) => {
    if (cartItem) {
      updateQuantity(cartItem.dishId, cartItem.quantity + delta);
    }
  };

  return (
    <div 
      className={cn(
        "bg-white rounded-2xl p-4 flex gap-4 transition-all hover:shadow-md border border-gray-50",
        !dish.isAvailable && "opacity-60 grayscale-[0.5]"
      )}
    >
      {/* Dish Image */}
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-foodify-orange-light flex-shrink-0">
        {dish.images && dish.images[0] ? (
          <img 
            src={dish.images[0]} 
            alt={dish.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-foodify-orange" />
          </div>
        )}
        
        {!dish.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
              No disponible
            </span>
          </div>
        )}
      </div>

      {/* Dish Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base md:text-lg text-text-primary leading-tight mb-1">
            {dish.name}
          </h3>
          <p className="text-text-secondary text-sm line-clamp-2 mb-2">
            {dish.description}
          </p>
          
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{dish.prepTimeMin} min</span>
            </div>
            {dish.allergens.length > 0 && (
              <div className="flex items-center gap-1">
                <span>• Alérgenos: {dish.allergens.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="font-bold text-lg text-foodify-orange">
            {formatCurrency(dish.price)}
          </span>

          {dish.isAvailable && (
            <div className="flex items-center">
              {cartItem ? (
                <div className="flex items-center bg-foodify-orange-light rounded-full p-1 border border-foodify-orange/20">
                  <button 
                    onClick={() => handleUpdateQty(-1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-foodify-orange shadow-sm active:scale-95 transition-transform"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-bold text-foodify-orange">
                    {cartItem.quantity}
                  </span>
                  <button 
                    onClick={() => handleUpdateQty(1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-foodify-orange text-white shadow-sm active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleAdd}
                  className="bg-foodify-orange hover:bg-foodify-orange-dark text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-foodify-orange/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
