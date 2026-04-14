"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { 
  BarChart3, 
  UtensilsCrossed, 
  Package, 
  Users, 
  FileText, 
  Grid, 
  Settings, 
  LogOut,
  Menu as MenuIcon,
  X,
  Bell,
  Sun,
  Moon,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const navItems = [
  { icon: BarChart3, label: "Dashboard", href: "/admin/dashboard" },
  { icon: UtensilsCrossed, label: "Menú", href: "/admin/menu" },
  { icon: Package, label: "Inventario", href: "/admin/inventory" },
  { icon: Users, label: "Staff", href: "/admin/staff" },
  { icon: FileText, label: "Pedidos", href: "/admin/orders" },
  { icon: Grid, label: "Mesas", href: "/admin/tables" },
  { icon: Settings, label: "Configuración", href: "/admin/config" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Hydration guard for Dark Mode (optional but good)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Sesión cerrada");
    router.push("/login");
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={cn("min-h-screen bg-app flex transition-colors font-outfit", isDarkMode && "dark")}>
      {/* SIDEBAR - DESKTOP */}
      <aside className="hidden lg:flex flex-col w-[260px] bg-white dark:bg-zinc-950 border-r border-border sticky top-0 h-screen z-50">
        <div className="p-6">
          <Logo />
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-50">
            Panel Administrativo
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all group",
                  isActive 
                    ? "bg-foodify-orange text-white shadow-lg shadow-foodify-orange/20" 
                    : "text-text-secondary hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-text-primary"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "group-hover:text-foodify-orange")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-text-secondary font-bold hover:text-red-500 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
           className="fixed inset-0 bg-black/50 z-[60] lg:hidden" 
           onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR PANEL */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-white dark:bg-zinc-950 z-[70] lg:hidden transition-transform duration-300 transform border-r border-border",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex justify-between items-center">
          <Logo />
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => (
             <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                  pathname === item.href ? "bg-foodify-orange text-white" : "text-text-secondary"
                )}
             >
               <item.icon className="w-5 h-5" />
               {item.label}
             </Link>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-zinc-950 border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsMobileMenuOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs hidden md:inline">Panel</span>
              <ChevronRight className="w-4 h-4 text-gray-300 hidden md:inline" />
              <h2 className="font-black text-lg truncate text-text-primary dark:text-white">
                {navItems.find(i => pathname === i.href)?.label || "Administración"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-foodify-orange rounded-full border border-white" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black">{user?.name || "Admin"}</p>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider opacity-60">
                   {user?.role === 'restaurant_admin' ? 'Administrador' : 'Staff'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-foodify-orange-light text-foodify-orange flex items-center justify-center font-black ring-2 ring-foodify-orange/20">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-900/50">
          <div className="max-w-7xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
