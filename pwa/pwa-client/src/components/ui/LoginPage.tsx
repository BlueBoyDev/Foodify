'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, ChefHat, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface LoginProps {
  type: 'admin' | 'codex';
}

export default function LoginPage({ type }: LoginProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation of POST /auth/login
    setTimeout(() => {
      setIsLoading(false);
      
      // Mock logic for demo
      if (email && password) {
        let role: any = type === 'codex' ? 'saas_admin' : 'restaurant_admin';
        
        setAuth({
          id: 'u1',
          name: type === 'codex' ? 'SaaS Master' : 'Admin Burger',
          email,
          role,
          restaurantId: type === 'admin' ? '1' : undefined,
        }, 'fake-jwt-token', 'fake-refresh-token');

        toast.success(`¡Bienvenido al Panel ${type === 'codex' ? 'CODEX' : 'Administrativo'}!`);
        router.push(type === 'codex' ? '/codex/dashboard' : '/admin/dashboard');
      } else {
        toast.error('Credenciales inválidas');
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Hero Image (Desktop only) */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden bg-foodify-orange">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1000')" }}>
          <div className="absolute inset-0 bg-foodify-orange/80 backdrop-blur-sm" />
        </div>
        
        <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-8 shadow-2xl animate-scale-in">
             <ChefHat className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Foodify PWA</h1>
          <p className="text-lg text-white/80 text-center max-w-md font-medium leading-relaxed">
            La plataforma integral para la gestión inteligente de restaurantes y servicios SaaS.
          </p>
          
          <div className="mt-20 grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-3xl font-extrabold">24/7</p>
              <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Soporte</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">100%</p>
              <p className="text-xs text-white/60 uppercase tracking-widest mt-1">Cloud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-bg-app lg:bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-16 h-16 bg-foodify-orange rounded-2xl flex items-center justify-center text-white shadow-xl">
              <ChefHat className="w-8 h-8" />
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Panel {type === 'codex' ? 'CODEX' : 'Administrativo'}
            </h2>
            <p className="text-gray-500 font-medium">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Correo Electrónico</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-foodify-orange transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@foodify.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white lg:bg-gray-50 border border-transparent focus:border-foodify-orange focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all shadow-sm focus:ring-4 focus:ring-foodify-orange/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-gray-700">Contraseña</label>
                <button type="button" className="text-xs font-bold text-foodify-orange hover:underline">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-foodify-orange transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white lg:bg-gray-50 border border-transparent focus:border-foodify-orange focus:bg-white rounded-2xl text-sm font-medium outline-none transition-all shadow-sm focus:ring-4 focus:ring-foodify-orange/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foodify-orange hover:bg-foodify-orange-dark text-white py-4 rounded-2xl font-bold shadow-xl shadow-foodify-orange/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LayoutDashboard className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center text-xs text-gray-400 font-medium">
            <p>© 2026 CODEX Software • Powered by Foodify</p>
          </div>
        </div>
      </div>
    </div>
  );
}
