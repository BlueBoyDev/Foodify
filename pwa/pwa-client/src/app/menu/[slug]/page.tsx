"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicApi } from "@/lib/api/axios";
import { useCartStore } from "@/lib/stores/useCartStore";
import { HeroSection } from "@/components/menu/HeroSection";
import { MenuTabs } from "@/components/menu/MenuTabs";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { DishCard } from "@/components/menu/DishCard";
import { CartFloatingButton } from "@/components/menu/CartFloatingButton";
import { CartDrawer } from "@/components/menu/CartDrawer";
import { UtensilsCrossed } from "lucide-react";
import { Restaurant, Menu, Category, Dish } from "@/lib/types";
import toast from "react-hot-toast";

export default function PublicMenuPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>("");
  const [activeCategoryId, setActiveCategoryId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Cart from store
  const { items } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        // Usar la ruta de root /menu/:slug como descubrimos en los logs
        const res = await publicApi.get(`/menu/${slug}`);
        
        // El backend v3.2 devuelve { data: { restaurant, menus } } o similar
        const { restaurant: restData, menus: menusData } = res.data.data || res.data;
        
        // Mapeo básico para asegurar que los tipos coincidan con nuestros componentes
        setRestaurant(restData);
        setMenus(menusData || []);
        
        if (menusData && menusData.length > 0) {
          const firstMenu = menusData[0];
          setActiveMenuId(firstMenu.id);
          if (firstMenu.categories && firstMenu.categories.length > 0) {
            setActiveCategoryId(firstMenu.categories[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching menu:", error);
        toast.error("No se pudo cargar el menú del restaurante.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const activeMenu = useMemo(() => menus.find(m => String(m.id) === String(activeMenuId)), [menus, activeMenuId]);
  const categories = activeMenu?.categories || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-app">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-foodify-orange/20 rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-foodify-orange animate-spin" />
          </div>
          <p className="text-gray-400 font-medium font-outfit">Cargando menú delicioso...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-app p-10 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
          <UtensilsCrossed className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black mb-2">Restaurante no encontrado</h2>
        <p className="text-gray-500 max-w-sm">Parece que el enlace es incorrecto o el restaurante ya no está disponible.</p>
        <button 
          onClick={() => router.push('/')}
          className="mt-8 px-6 py-2 bg-foodify-orange text-white rounded-full font-bold"
        >
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-bg-app pb-24 lg:pb-0 font-outfit">
      {/* Hero Section */}
      <HeroSection restaurant={restaurant} />

      {/* Menu Tabs */}
      {menus.length > 1 && (
        <MenuTabs 
          menus={menus} 
          activeMenuId={activeMenuId} 
          onSelect={(id) => {
            setActiveMenuId(id);
            const firstCat = menus.find(m => String(m.id) === String(id))?.categories[0];
            if (firstCat) setActiveCategoryId(firstCat.id);
          }} 
        />
      )}

      {/* Mobile Category Nav */}
      <CategoryNav 
        categories={categories} 
        activeCategoryId={activeCategoryId} 
        onSelect={setActiveCategoryId} 
        orientation="horizontal"
      />

      <div className="container mx-auto px-4 lg:py-12 flex gap-8">
        {/* Desktop Sidebar Nav */}
        <CategoryNav 
          categories={categories} 
          activeCategoryId={activeCategoryId} 
          onSelect={setActiveCategoryId} 
          orientation="vertical"
        />

        {/* Content Area */}
        <div className="flex-1 space-y-12">
          {categories.length > 0 ? (
            categories.map((category) => (
              <section 
                key={category.id} 
                id={`cat-${category.id}`}
                className="scroll-mt-32"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 bg-foodify-orange rounded-full" />
                  <h2 className="text-2xl font-black">{category.name}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.dishes.length > 0 ? (
                    category.dishes.map((dish) => (
                      <DishCard key={dish.id} dish={dish} />
                    ))
                  ) : (
                    <p className="text-gray-400 italic text-sm">No hay platillos en esta categoría.</p>
                  )}
                </div>
              </section>
            ))
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400">Este menú no tiene categorías configuradas.</p>
            </div>
          )}

          {/* Contact Section Placeholder (Optional in v3.2 logic) */}
        </div>
      </div>

      {/* Cart Components */}
      <CartFloatingButton onClick={() => setIsCartOpen(true)} />
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          router.push(`/menu/${slug}/checkout`);
        }}
      />
    </main>
  );
}
