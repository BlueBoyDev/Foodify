import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/stores/useCartStore';
import { formatCurrency } from '@/lib/utils';

interface CartFloatingButtonProps {
  onClick: () => void;
}

export const CartFloatingButton: React.FC<CartFloatingButtonProps> = ({ onClick }) => {
  const { getItemCount, getTotal } = useCartStore();
  const count = getItemCount();
  const total = getTotal();

  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-foodify-orange text-white flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full shadow-2xl shadow-foodify-orange/40 hover:bg-foodify-orange-dark transition-all active:scale-95 animate-slide-up"
    >
      <div className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        <span className="font-bold text-sm">Ver orden • {formatCurrency(total)}</span>
      </div>
      
      <div className="bg-white text-foodify-orange w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-foodify-orange/20">
        {count}
      </div>
    </button>
  );
};
