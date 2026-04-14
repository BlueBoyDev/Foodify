"use client";

import React, { useState } from "react";
import { useCartStore } from "@/lib/stores/useCartStore";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus, ShoppingBag, X } from "lucide-react";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";

interface CartDrawerProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  onCheckout: (notes: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ children, isOpen: propIsOpen, onClose: propOnClose, onCheckout }) => {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const [notes, setNotes] = useState("");
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Handle both controlled and uncontrolled states
  const isOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (propOnClose && !val) propOnClose();
    setInternalIsOpen(val);
  };

  const subtotal = getTotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0 font-outfit border-l dark:border-border dark:bg-zinc-950">
        <SheetHeader className="p-6 border-b dark:border-border">
          <SheetTitle className="flex items-center gap-2 text-xl font-black">
            <ShoppingBag className="w-5 h-5 text-foodify-orange" />
            Tu Orden Para Llevar
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="bg-gray-50 dark:bg-zinc-900 p-8 rounded-full border border-dashed dark:border-border">
                <ShoppingBag className="w-12 h-12 opacity-20" />
              </div>
              <p className="font-bold text-lg">Tu carrito está vacío</p>
              <Button variant="ghost" className="text-foodify-orange hover:text-foodify-orange-dark font-black" onClick={() => setIsOpen(false)}>
                Volver al menú
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.dishId} className="flex gap-4 group border-b dark:border-border pb-4 last:border-0">
                    <div className="border relative w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-900 shrink-0">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-foodify-orange-light dark:bg-zinc-800">
                           <ShoppingBag className="w-6 h-6 text-foodify-orange/20" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-black text-sm truncate text-text-primary dark:text-white">{item.name}</h4>
                        <span className="font-black text-sm text-foodify-orange">{formatCurrency(item.price * item.quantity)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-900 border dark:border-border rounded-xl px-2 py-1">
                          <button 
                             onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                             className="p-1 text-text-secondary hover:text-foodify-orange transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black min-w-[2ch] text-center dark:text-white">{item.quantity}</span>
                          <button 
                             onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                             className="p-1 text-text-secondary hover:text-foodify-orange transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => removeItem(item.dishId)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t dark:border-border">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Nota especial para el restaurante</label>
                <textarea 
                  className="w-full h-24 p-4 text-sm rounded-2xl border dark:border-border bg-gray-50 dark:bg-zinc-900 focus:ring-2 focus:ring-foodify-orange/20 focus:outline-none transition-all resize-none shadow-inner"
                  placeholder="Ej. Sin cebolla, extra salsa..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <SheetFooter className="p-6 bg-white dark:bg-zinc-950 border-t dark:border-border flex flex-col gap-6 sm:flex-col sm:space-x-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>IVA (16%)</span>
                <span>{formatCurrency(iva)}</span>
              </div>
              <div className="flex justify-between font-black text-xl pt-4 border-t dark:border-border text-text-primary dark:text-white">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 bg-foodify-orange hover:bg-foodify-orange-dark text-white font-black rounded-2xl shadow-lg shadow-foodify-orange/20 transition-all active:scale-95"
              onClick={() => onCheckout(notes)}
            >
              Confirmar pedido ({items.length})
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
