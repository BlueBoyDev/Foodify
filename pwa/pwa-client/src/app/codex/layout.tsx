"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { 
  BarChart3, 
  Store, 
  CreditCard, 
  Settings2, 
  LifeBuoy, 
  LogOut,
  Menu as MenuIcon,
  X,
  Bell,
  ShieldCheck,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navItems = [
  { icon: Store, label: "Restaurantes", href: "/codex/dashboard" },
  { icon: CreditCard, label: "Suscripciones", href: "/codex/subscriptions" },
  { icon: LifeBuoy, label: "Soporte / Tickets", href: "/codex/support" },
  { icon: Settings2, label: "Configuración Global", href: "/codex/config" },
];

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    router.push("/codex/login");
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex transition-colors">
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-[#111111] border-r border-white/5 sticky top-0 h-screen z-50">
        <div className="p-6">
          <Logo variant="codex" />
          <div className="flex items-center gap-1.5 mt-1 px-1">
             <Zap className="w-3 h-3 text-foodify-orange fill-foodify-orange" />
             <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
               SaaS Master Panel
             </p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  isActive 
                    ? "bg-white text-black shadow-lg" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
           <div className="p-4 rounded-xl bg-foodify-orange/10 border border-foodify-orange/20 mb-4">
              <p className="text-[10px] font-black text-foodify-orange uppercase mb-1">Status Sistema</p>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-xs font-bold text-white/80">Todos los servicios OK</span>
              </div>
           </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-white/40 font-bold hover:text-red-400 rounded-xl hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR PANEL (SIMPLIFIED) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-[#111111] z-[70] lg:hidden transition-transform duration-300 transform border-r border-white/5",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <Logo variant="codex" />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
             <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href ? "bg-white text-black" : "text-white/60"
                )}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-16 bg-[#111111] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-foodify-orange">
               <ShieldCheck className="w-5 h-5" />
               <h2 className="font-black text-lg">CODEX</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-white/60 hover:text-white">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-foodify-orange rounded-full" />
            </Button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{user?.name || "Superadmin"}</p>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
                  SaaS Administrator
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white font-black">
                {user?.name?.charAt(0) || "C"}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 overflow-y-auto bg-[#111111]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
