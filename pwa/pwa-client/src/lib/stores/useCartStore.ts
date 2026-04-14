import { create } from 'zustand';

export interface CartItem {
  dishId: number;
  name: string;
  price: number;
  quantity: number;
  specialNotes?: string;
  image_url?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.dishId === item.dishId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.dishId === item.dishId ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      });
    } else {
      set({ items: [...items, item] });
    }
  },
  removeItem: (dishId) => {
    set({ items: get().items.filter((i) => i.dishId !== dishId) });
  },
  updateQuantity: (dishId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(dishId);
      return;
    }
    set({
      items: get().items.map((i) => (i.dishId === dishId ? { ...i, quantity } : i)),
    });
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },
  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
