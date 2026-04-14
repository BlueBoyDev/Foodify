import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type UserRole = 'restaurant_admin' | 'saas_admin' | 'waiter' | 'chef' | 'cashier';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'foodify_auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
