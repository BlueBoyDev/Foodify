"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  ShoppingBag, 
  Clock, 
  MapPin, 
  Star, 
  Plus, 
  Minus, 
  X, 
  CheckCircle2,
  ChevronRight,
  Info,
  UtensilsCrossed
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { fetchPublicMenu, getFullAdminMenuApi, RESTAURANT_SLUG } from "@/lib/menuApi";
import { createPublicOrderApi } from "@/lib/ordersApi";
import { useGuestOrders } from "@/lib/useGuestOrders";
import { MenuSkeleton } from "@/components/ui/Skeletons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { PublicMenu, Dish, CartItem } from "@/types/menu";
import toast from "react-hot-toast";

// ─── COMPONENTES INTERNOS ───────────────────────────────────────────────────

function ParaLlevarContent() {
  const { dark } = useTheme();
  const { addOrder } = useGuestOrders();
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const urlSlug = searchParams.get("slug");
  const urlTable = searchParams.get("table");
  const urlMode = searchParams.get("mode") as "takeout" | "dine_in" | null;
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerPhone, setCustomerPhone] = useState("");

  // State
  const [data, setData] = useState<{
    menus: PublicMenu[];
    restaurant: { id: number; name: string; logoUrl?: string; isOpen: boolean };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState<"not_found" | "empty" | "error" | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [lastOrder, setLastOrder] = useState<any>(null); // Guardamos la última orden para el modal de éxito

  // Load Data
  useEffect(() => {
    async function load() {
      if (authLoading && !urlSlug) return;
      try {
        // Prioridad: URL > Slug Global (demo-restaurant) > Perfil de usuario
        const slugToUse = urlSlug || RESTAURANT_SLUG || (user?.slug && user.slug.trim() !== "" ? user.slug : undefined);
        const modeToUse = urlMode || "takeout";
        
        setErrorType(null);
        // Forzamos el uso del Menú Público para todos (comensales y staff)
        // para asegurar que todos vean exactamente lo mismo que se configuró para el cliente.
        const res = await fetchPublicMenu(slugToUse, modeToUse);
        
        setData(res);
        if (res.menus.length > 0) {
          setActiveMenuId(res.menus[0].id);
        } else {
          setErrorType("empty");
        }
      } catch (err: any) {
        console.error("Error loading menu:", err);
        if (err.response?.status === 404) {
          setErrorType("not_found");
        } else {
          setErrorType("error");
          toast.error("No se pudo cargar el menú del servidor");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [urlSlug, user?.slug, authLoading, urlMode]);

  // Derived State
  const activeMenu = useMemo(() => 
    data?.menus.find(m => m.id === activeMenuId) || null
  , [data, activeMenuId]);

  const filteredDishes = useMemo(() => {
    if (!activeMenu) return [];
    let items: Dish[] = [];
    activeMenu.categories.forEach(cat => {
      if (activeCategoryId !== "all" && cat.id !== activeCategoryId) return;
      cat.dishes?.forEach(d => {
        if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return;
        items.push(d);
      });
    });
    return items;
  }, [activeMenu, activeCategoryId, search]);

  const cartTotal = cart.reduce((acc, i) => acc + (i.dish.price * i.qty), 0);

  // Handlers
  const addToCart = (dish: Dish, qty: number) => {
    setCart((prev) => {
      const idx = prev.findIndex(i => i.dish.id === dish.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].qty += qty;
        return next;
      }
      return [...prev, { dish, qty }];
    });
    setSelectedDish(null);
    toast.success(`${dish.name} agregado`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => 
      i.dish.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.dish.id !== id));
    toast.error("Producto eliminado");
  };

   const handleCreateOrder = async () => {
     // Validaciones básicas
     if (cart.length === 0) {
       toast.error("Tu carrito está vacío");
       return;
     }

     if (!customerName.trim()) {
       toast.error("Por favor ingresa tu nombre");
       return;
     }

     if (!customerPhone.trim()) {
       toast.error("Por favor ingresa tu teléfono para el seguimiento");
       return;
     }

     // Validar formato de teléfono (10-15 dígitos)
     const phoneDigits = customerPhone.replace(/\D/g, '');
     if (phoneDigits.length < 10 || phoneDigits.length > 15) {
       toast.error("Ingresa un teléfono válido (10-15 dígitos)");
       return;
     }

     try {
       // Llamada con restaurantId dinámico desde el estado data
       const res = await createPublicOrderApi({
         restaurantId:  Number(data?.restaurant.id),
         customerName:  customerName.trim(),
         customerPhone: customerPhone.trim(),
         items: cart.map(i => ({
           dishId:   Number(i.dish.id),
           quantity: Number(i.qty)
         })),
       });

       addOrder({
         id: String(res.id),
         folio: res.folio,
         status: "nuevo",
         createdAt: new Date().toISOString(),
         items: cart.map(i => ({
           dishId: i.dish.id,
           dishName: i.dish.name,
           qty: i.qty,
           unitPrice: i.dish.price
         })),
         qrCode: res.qrCode,
       });

       setLastOrder(res);
       setCart([]);
       setShowCart(false);
       toast.custom((t) => (
         <div className="bg-zinc-900 border border-white/10 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 shadow-foodify-orange/20">
           <div className="bg-foodify-orange p-2 rounded-full">
             <CheckCircle2 className="w-6 h-6 text-white" />
           </div>
           <div className="flex flex-col">
             <span className="font-black text-lg tracking-tight">¡Pedido enviado con éxito!</span>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foodify-orange">Tu Folio: #{res.folio}</span>
           </div>
         </div>
       ), { duration: 5000 });
     } catch (err: any) {
       const errorMsg = err.response?.data?.message || err.message || "Error al crear el pedido";
       console.error("Order creation failed:", errorMsg, err.response?.data);
       toast.error(`Error: ${errorMsg}`);
     }
   };

  if (loading) return <MenuSkeleton />;
  
  if (errorType || !data || data.menus.length === 0) {
    const is404 = errorType === "not_found";
    return (
      <div className={cn(
        "min-h-screen flex flex-col items-center justify-center p-12 text-center transition-colors",
        dark ? "bg-zinc-950 text-white" : "bg-gray-50 text-zinc-900"
      )}>
        <UtensilsCrossed className={cn("w-16 h-16 mb-4 opacity-20", is404 ? "text-red-500" : "text-foodify-orange")} />
        <h2 className="text-2xl font-black mb-2">
          {is404 ? "Restaurante no encontrado" : "Restaurante Cerrado"}
        </h2>
        <p className="text-text-secondary max-w-xs">
          {is404 
            ? `No pudimos encontrar el restaurante con el identificador "${urlSlug || RESTAURANT_SLUG}". Verifica la URL e inténtalo de nuevo.`
            : "No hay menús activos en este momento. Vuelve más tarde o revisa nuestras redes sociales."
          }
        </p>
        <div className="flex gap-4 mt-8">
           <Button variant="outline" className="rounded-xl font-bold" onClick={() => window.location.reload()}>Reintentar</Button>
           {is404 && <Button className="bg-foodify-orange text-white rounded-xl font-bold" onClick={() => window.location.href = "/para-llevar"}>Ir al Inicio</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen pb-32 transition-colors",
      dark ? "bg-zinc-950 text-white" : "bg-gray-50 text-zinc-900"
    )}>
      {/* ─── HERO HEADER ─── */}
      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-foodify-orange" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded text-[10px] font-black tracking-widest text-white uppercase border border-white/20">
              {data.restaurant.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
               <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Abierto ahora
            </span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter leading-tight italic">
            PARA LLEVAR
          </h1>
          <div className="flex items-center gap-4 text-white/70 text-xs font-bold uppercase tracking-widest">
             <span className="flex items-center gap-1"><Star className="w-3 h-3 text-foodify-orange fill-foodify-orange" /> 4.9</span>
             <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 15-25 min</span>
             <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Sucursal Principal</span>
          </div>
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-6 -mt-8 relative z-10 space-y-8">
        
        {/* BUSCADOR Y SELECTOR DE MENÚ */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-foodify-orange transition-colors" />
            <input 
              type="text"
              placeholder="Busca tu platillo favorito..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-12 pr-6 py-5 rounded-3xl border-none outline-none text-md font-bold shadow-2xl transition-all",
                dark ? "bg-white/10 backdrop-blur-xl focus:bg-white/20" : "bg-white focus:ring-2 focus:ring-foodify-orange/20 shadow-black/5"
              )}
            />
          </div>

          {/* MENU SELECTOR (TABS) */}
          {data.menus.length > 1 && (
            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-x-auto scrollbar-hide">
              {data.menus.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setActiveMenuId(m.id);
                    setActiveCategoryId("all");
                  }}
                  className={cn(
                    "flex-1 whitespace-nowrap px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    activeMenuId === m.id 
                      ? "bg-foodify-orange text-white shadow-lg" 
                      : (dark ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-gray-100")
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CATEGORIAS HORIZONTAL */}
        {activeMenu && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-6 px-6">
            <button
               onClick={() => setActiveCategoryId("all")}
               className={cn(
                 "whitespace-nowrap px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                 activeCategoryId === "all" 
                   ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                   : (dark ? "bg-white/5 text-gray-400" : "bg-white text-gray-500 border")
               )}
            >
              Todos
            </button>
            {activeMenu.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={cn(
                  "whitespace-nowrap px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                  activeCategoryId === cat.id 
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" 
                    : (dark ? "bg-white/5 text-gray-400" : "bg-white text-gray-500 border")
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* GRID DE PLATILLOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {filteredDishes.map((dish) => (
            <div 
              key={dish.id}
              onClick={() => {
                setModalQty(1);
                setSelectedDish(dish);
              }}
              className={cn(
                "group relative overflow-hidden rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                dark ? "bg-zinc-900/50 border border-white/5" : "bg-white border border-gray-100 shadow-xl shadow-black/5"
              )}
            >
              <div className="aspect-[1/1] overflow-hidden relative">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className={cn("w-full h-full flex items-center justify-center", dark ? "bg-white/5" : "bg-gray-50")}>
                    <ShoppingBag className="w-16 h-16 text-gray-200" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {dish.badge && (
                    <span className="bg-foodify-orange text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                      {dish.badge}
                    </span>
                  )}
                </div>

                {!dish.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white font-black uppercase tracking-widest text-sm border-2 border-white px-6 py-3">
                       Agotado
                    </span>
                  </div>
                )}
                
                <div className="absolute bottom-6 right-6 translate-y-20 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="bg-foodify-orange text-white p-4 rounded-3xl shadow-2xl scale-110">
                      <Plus className="w-6 h-6" />
                    </div>
                </div>
              </div>

              <div className="p-8">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-black text-xl leading-tight group-hover:text-foodify-orange transition-colors">{dish.name}</h3>
                  <span className="text-xl font-black text-foodify-orange">${dish.price}</span>
                </div>
                <p className={cn("text-xs leading-relaxed line-clamp-2 font-medium", dark ? "text-white/40" : "text-gray-400")}>
                  {dish.description || "Un platillo de autor preparado con ingredientes frescos y técnicas artesanales."}
                </p>
                <div className="flex items-center gap-3 mt-4 text-[10px] font-black uppercase tracking-tighter text-text-secondary">
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dish.prepTime || 15} min</span>
                   <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="w-3 h-3" /> Disponible</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-8 left-6 right-6 z-50 animate-in slide-in-from-bottom-12 duration-500">
          <div 
            onClick={() => setShowCart(true)}
            className="max-w-screen-sm mx-auto bg-zinc-900 text-white p-5 rounded-[2.5rem] shadow-2xl flex items-center justify-between cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-5">
               <div className="bg-foodify-orange p-4 rounded-2xl relative shadow-lg shadow-foodify-orange/30">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-zinc-900 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                    {cart.reduce((s, i) => s + i.qty, 0)}
                  </span>
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-lg tracking-tight">Ver tu pedido</span>
                  <span className="text-[10px] uppercase font-black tracking-widest text-foodify-orange">Total: ${cartTotal.toFixed(2)}</span>
               </div>
            </div>
            <div className="bg-white/10 p-3 rounded-full mr-1">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* DISH DETAIL MODAL */}
      {selectedDish && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedDish(null)} />
           <div className={cn(
             "relative w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] overflow-hidden animate-in slide-in-from-bottom duration-500",
             dark ? "bg-zinc-900" : "bg-white"
           )}>
             <button onClick={() => setSelectedDish(null)} className="absolute top-8 right-8 z-10 p-3 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors">
                <X className="w-6 h-6" />
             </button>
             
             <div className="h-80 sm:h-96 relative">
               {selectedDish.imageUrl ? (
                 <img src={selectedDish.imageUrl} alt={selectedDish.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-foodify-orange/10 flex items-center justify-center text-foodify-orange">
                   <ShoppingBag className="w-24 h-24 opacity-20" />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent" />
               <div className="absolute bottom-10 left-10 right-10">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedDish.badge && <span className="bg-foodify-orange text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">{selectedDish.badge}</span>}
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedDish.prepTime || 15} MIN</span>
                  </div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter mb-1">{selectedDish.name}</h2>
                  <span className="text-foodify-orange font-black text-2xl">${selectedDish.price}</span>
               </div>
             </div>

             <div className="p-10 space-y-8">
               <div className="space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Información del platillo</h4>
                 <p className={cn("text-md leading-relaxed", dark ? "text-white/60" : "text-gray-500")}>
                   {selectedDish.description || "Disfruta de nuestra receta especial de la casa, preparada artesanalmente con los mejores ingredientes locales al momento de tu pedido."}
                 </p>
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                  <div className="flex items-center justify-between w-full sm:w-auto gap-8 bg-zinc-100 dark:bg-white/5 p-3 rounded-2xl border border-black/5 dark:border-white/10">
                    <button 
                      onClick={() => setModalQty(prev => Math.max(1, prev - 1))}
                      className="w-12 h-12 flex items-center justify-center bg-white dark:bg-white/10 rounded-xl shadow-md active:scale-90 transition-transform"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="font-black w-8 text-center text-2xl">{modalQty}</span>
                    <button 
                      onClick={() => setModalQty(prev => prev + 1)}
                      className="w-12 h-12 flex items-center justify-center bg-foodify-orange text-white rounded-xl shadow-xl shadow-foodify-orange/20 active:scale-90 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <Button 
                    onClick={() => addToCart(selectedDish, modalQty)}
                    className="w-full flex-1 h-16 bg-foodify-orange hover:bg-foodify-orange/90 text-white font-black text-xl rounded-2xl shadow-2xl shadow-foodify-orange/30 transition-all active:scale-[0.98]"
                  >
                    Agregar a la orden
                  </Button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* CART MODAL (SIDE SHEET DESIGN) */}
      {showCart && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCart(false)} />
          <div className={cn(
            "relative w-full max-w-lg h-full flex flex-col animate-in slide-in-from-right duration-500",
            dark ? "bg-zinc-900" : "bg-white"
          )}>
            <div className="p-10 border-b dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-black tracking-tighter italic">MI PEDIDO</h2>
                <button onClick={() => setShowCart(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"><X className="w-8 h-8" /></button>
              </div>
              <p className="text-[10px] text-text-secondary uppercase tracking-[0.3em] font-black">Foodify Experience • Takeout</p>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <ShoppingBag className="w-20 h-20 mb-4" />
                  <p className="font-bold">Tu carrito está vacío</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="w-20 h-20 rounded-3xl overflow-hidden flex-shrink-0 bg-gray-100 border border-black/5">
                      <img src={item.dish.imageUrl || ""} alt={item.dish.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="font-black text-md leading-tight">{item.dish.name}</h5>
                        <span className="font-black text-foodify-orange text-md">${(item.dish.price * item.qty).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4 bg-zinc-100 dark:bg-white/5 px-3 py-1.5 rounded-xl">
                            <button onClick={() => updateQty(item.dish.id, -1)} className="p-1 hover:text-foodify-orange transition-colors"><Minus className="w-4 h-4" /></button>
                            <span className="text-sm font-black w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item.dish.id, 1)} className="p-1 hover:text-foodify-orange transition-colors"><Plus className="w-4 h-4" /></button>
                         </div>
                         <button 
                           onClick={() => removeFromCart(item.dish.id)}
                           className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                         >
                           Eliminar
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-10 space-y-6 bg-zinc-50 dark:bg-white/5 border-t dark:border-white/5">
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Tu Nombre</p>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-foodify-orange transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Tu Teléfono (Para seguimiento)</p>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej. 3312345678"
                    className="w-full h-14 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl px-4 font-bold focus:ring-2 focus:ring-foodify-orange transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t dark:border-white/5">
                <div className="flex justify-between items-center text-sm font-bold text-text-secondary uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-black tracking-tighter">
                  <span>TOTAL</span>
                  <span className="text-foodify-orange">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
              <Button 
                onClick={() => handleCreateOrder()}
                disabled={cart.length === 0 || !customerName.trim() || !customerPhone.trim()}
                className="w-full h-20 bg-foodify-orange hover:bg-foodify-orange/90 text-white font-black text-2xl rounded-[1.5rem] shadow-2xl shadow-foodify-orange/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                COMPLETAR PEDIDO
              </Button>
              <p className="text-center text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">
                 Al dar click aceptas nuestras políticas de servicio
              </p>
            </div>
          </div>
        </div>
      )}
      {/* SUCCESS ORDER MODAL */}
      {lastOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in duration-500" />
          <div className={cn(
            "relative w-full max-w-sm rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl",
            dark ? "bg-zinc-900 border border-white/10" : "bg-white"
          )}>
            <div className="p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-green-500 p-4 rounded-full shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-3xl font-black italic tracking-tighter uppercase">¡Pedido Enviado!</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foodify-orange">Tu Folio es #{lastOrder.folio}</p>
              </div>

              {lastOrder.qrCode ? (
                <div className="bg-white p-6 rounded-3xl shadow-inner inline-block mx-auto border-4 border-zinc-100 dark:border-white/5">
                   <img src={lastOrder.qrCode} alt="QR Seguimiento" className="w-48 h-48" />
                   <p className="mt-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Muestra este código al recoger</p>
                </div>
              ) : (
                <div className="py-12 opacity-50 space-y-2">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-foodify-orange" />
                  <p className="text-xs font-bold uppercase tracking-widest">Generando seguimiento...</p>
                </div>
              )}

              <Button 
                onClick={() => setLastOrder(null)}
                className="w-full h-16 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black text-lg rounded-2xl transition-all active:scale-95 shadow-xl"
              >
                Volver al Menú
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ParaLlevarPage() {
  return (
    <Suspense fallback={<MenuSkeleton />}>
      <ParaLlevarContent />
    </Suspense>
  );
}
