"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { Input } from "@/components/ui/Input";
import { 
  Plus, 
  Search, 
  Filter, 
  GripVertical, 
  Edit3, 
  Trash2, 
  Clock, 
  Check,
  ChevronRight,
  Beef,
  Coffee,
  Pizza,
  Salad,
  IceCream,
  UtensilsCrossed
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

import { useFetchWithState } from "@/lib/useFetchWithState";
import { getAdminMenusApi, getAdminCategoriesApi, getDishesApi, toggleDishAvailabilityApi, toggleMenuAvailabilityApi } from "@/lib/menuApi";
import { AddCategoryModal } from "@/components/modals/AddCategoryModal";
import { AddDishModal } from "@/components/modals/AddDishModal";
import toast from "react-hot-toast";

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState("menus");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: menus, loading: menusLoading, refetch: refetchMenus } = useFetchWithState("admin-menus", getAdminMenusApi, 15000);
  const { data: categories, loading: catsLoading, refetch: refetchCats } = useFetchWithState("admin-categories", getAdminCategoriesApi, 15000);
  const { data: dishes, loading: dishesLoading, refetch: refetchDishes } = useFetchWithState("admin-dishes", getDishesApi, 15000);

  const toggleDish = async (id: string, current: boolean) => {
    try {
      await toggleDishAvailabilityApi(id, !current);
      toast.success("Estado del platillo actualizado");
      refetchDishes();
    } catch {
      toast.error("Error al actualizar estado del platillo");
    }
  };

  const toggleMenu = async (id: string, current: boolean) => {
    try {
      await toggleMenuAvailabilityApi(id, !current);
      toast.success("Estado del menú actualizado");
      refetchMenus();
    } catch {
      toast.error("Error al actualizar estado del menú");
    }
  };

  const loading = menusLoading || catsLoading || dishesLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Gestión de Menú</h1>
          <p className="text-text-secondary">Organiza tus menús, categorías y platillos.</p>
        </div>
        
        <div className="flex gap-2">
           <Button 
             onClick={() => setIsAddModalOpen(true)}
             className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20"
           >
              <Plus className="w-5 h-5 mr-2" />
              {activeTab === "menus" ? "Crear Menú" : activeTab === "categories" ? "Agregar Categoría" : "Nuevo Platillo"}
           </Button>
        </div>
      </div>

      <AddCategoryModal 
        isOpen={isAddModalOpen && activeTab === "categories"}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetchCats()}
        menus={menus || []}
      />

      <AddDishModal 
        isOpen={isAddModalOpen && activeTab === "dishes"}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetchDishes()}
        categories={categories || []}
      />

      <Tabs defaultValue="menus" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white dark:bg-zinc-900 border p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-3">
          <TabsTrigger value="menus" className="font-bold py-2 rounded-lg">Menús</TabsTrigger>
          <TabsTrigger value="categories" className="font-bold py-2 rounded-lg">Categorías</TabsTrigger>
          <TabsTrigger value="dishes" className="font-bold py-2 rounded-lg">Platillos</TabsTrigger>
        </TabsList>

        {loading && !menus && (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foodify-orange" />
          </div>
        )}

        {/* TAB MENUS */}
        <TabsContent value="menus" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {(menus || []).map((menu) => (
              <Card key={menu.id} className="hover:border-foodify-orange transition-colors">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-colors bg-foodify-orange-light text-foodify-orange">
                        <UtensilsCrossed className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-lg">{menu.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-text-secondary font-medium mt-1">
                           <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Horario: Rotativo</span>
                           <span className="flex items-center gap-1">• #{menu.id}</span>
                        </div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-6 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-4 sm:pt-0">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Estado</span>
                         <Switch 
                           checked={menu.isActive} 
                           onCheckedChange={() => toggleMenu(menu.id, menu.isActive)} 
                         />
                      </div>
                      <div className="flex items-center gap-2">
                         <Button variant="outline" size="sm" className="font-bold h-9">Gestionar</Button>
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-text-secondary">
                            <Edit3 className="w-4 h-4" />
                         </Button>
                         <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400">
                            <Trash2 className="w-4 h-4" />
                         </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB CATEGORIAS */}
        <TabsContent value="categories" className="space-y-4">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <p className="text-sm font-bold text-text-secondary flex items-center gap-2">
                Viendo categorías de: 
                <span className="text-foodify-orange bg-foodify-orange-light px-3 py-1 rounded-lg">Menú del Día</span>
              </p>
           </div>

            <div className="grid grid-cols-1 gap-3">
              {(categories || []).map((cat) => (
                 <div 
                   key={cat.id} 
                   className="bg-white dark:bg-zinc-900 border rounded-2xl p-4 flex items-center justify-between group hover:border-foodify-orange transition-all cursor-move"
                 >
                    <div className="flex items-center gap-4">
                       <GripVertical className="w-5 h-5 text-gray-300 group-hover:text-foodify-orange" />
                       <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-text-primary text-xl">
                          {cat.emoji || "📁"}
                       </div>
                       <div>
                         <h4 className="font-bold text-sm">{cat.name}</h4>
                         <p className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">ID: {cat.id}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="icon" className="h-9 w-9">
                          <Edit3 className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500">
                          <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                 </div>
              ))}
            </div>
           <p className="text-center text-xs text-text-secondary font-medium italic pt-4">
             Arrastra los elementos para reordenarlos en el menú público.
           </p>
        </TabsContent>

        {/* TAB PLATILLOS */}
        <TabsContent value="dishes" className="space-y-6">
           <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                 <Input className="pl-10 h-10 rounded-xl" placeholder="Buscar platillo por nombre..." />
              </div>
              <div className="flex gap-2">
                 <Button variant="outline" className="h-10 rounded-xl font-bold gap-2">
                    <Filter className="w-4 h-4" /> Categoría: Todos
                 </Button>
                 <Button variant="outline" className="h-10 rounded-xl font-bold gap-2">
                    Estado: Todos
                 </Button>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(dishes || []).map((dish) => (
                <Card key={dish.id} className="overflow-hidden group hover:border-foodify-orange transition-all">
                   <div className="relative h-44 bg-foodify-orange-light flex items-center justify-center">
                     {dish.imageUrl ? (
                        <img src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover" />
                     ) : (
                        <UtensilsCrossed className="w-12 h-12 text-foodify-orange opacity-20" />
                     )}
                      <div className="absolute top-4 left-4">
                         <Switch 
                           checked={dish.isAvailable} 
                           onCheckedChange={() => toggleDish(dish.id, dish.isAvailable)}
                         />
                      </div>
                   </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-black text-lg leading-tight">{dish.name}</h4>
                       <span className="font-black text-foodify-orange">${dish.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">
                       Categoría: {dish.categoryId}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-text-secondary border-t pt-4">
                       <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dish.prepTime} min</span>
                       <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold">Editar</Button>
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg font-bold text-red-500">Eliminar</Button>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
