"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  Package, 
  Calendar, 
  ArrowRightLeft, 
  Filter,
  History,
  MoreVertical,
  Clock,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useFetchWithState } from "@/lib/useFetchWithState";
import { getInventoryItemsApi } from "@/lib/inventoryApi";
import { AddInventoryItemModal } from "@/components/modals/AddInventoryItemModal";
import { AddLotModal } from "@/components/modals/AddLotModal";

export default function AdminInventoryPage() {
  const [activeModal, setActiveModal] = useState<"item" | "lot" | null>(null);
  const { 
    data: items, 
    loading, 
    refetch 
  } = useFetchWithState("inventory", getInventoryItemsApi, 15000);

  // Derivamos KPIs y alertas del servidor en lugar de estáticos
  const totalInsumos = items?.length ?? 0;
  const lowStockCount = items?.filter(i => i.currentStock <= i.minStock).length ?? 0;
  const criticalItems = items?.filter(i => (i.currentStock / i.minStock) < 0.5) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Inventario</h1>
          <p className="text-text-secondary">Control de insumos, lotes y almacén central.</p>
        </div>
        
        <div className="flex gap-2">
           <Button 
             variant="outline" 
             className="font-bold h-11 px-6 rounded-xl border-gray-200"
             onClick={() => setActiveModal("lot")}
           >
              <History className="w-5 h-5 mr-2" /> Entradas
           </Button>
           <Button 
             className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20"
             onClick={() => setActiveModal("item")}
           >
              <Plus className="w-5 h-5 mr-2" /> Agregar Insumo
           </Button>
        </div>
      </div>

      <AddInventoryItemModal 
        isOpen={activeModal === "item"} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => refetch()} 
      />

      <AddLotModal 
        isOpen={activeModal === "lot"} 
        onClose={() => setActiveModal(null)} 
        onSuccess={() => refetch()} 
        items={items || []}
      />

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-foodify-orange-light rounded-2xl text-foodify-orange">
               <Package className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Total Insumos</p>
               <h3 className="text-2xl font-black">{totalInsumos} Items</h3>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-red-100 rounded-2xl text-red-500">
               <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Bajo Stock</p>
               <h3 className="text-2xl font-black">{lowStockCount} Alertas</h3>
            </div>
         </div>
         <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border flex items-center gap-6 shadow-sm">
            <div className="p-4 bg-orange-100 rounded-2xl text-orange-500">
               <Calendar className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest">Prox. a vencer</p>
               <h3 className="text-2xl font-black">{criticalItems.length} Lotes</h3>
            </div>
         </div>
      </div>

      {/* ALERTAS CRÍTICAS (Section - Módulo 3 Requerimiento R2) */}
      {lowStockCount > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-lg text-white animate-pulse">
                 <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-red-700">Tienes {lowStockCount} productos con bajo stock o lotes vencidos que requieren atención.</p>
           </div>
           <Button variant="link" className="text-red-700 font-bold text-xs uppercase tracking-wider">Ver Alertas</Button>
        </div>
      )}

      {loading && !items && (
        <div className="flex justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foodify-orange" />
        </div>
      )}

      <Tabs defaultValue="insumos" className="space-y-6">
         <TabsList className="bg-white dark:bg-zinc-900 border p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-2">
            <TabsTrigger value="insumos" className="font-bold py-2 rounded-lg">Insumos</TabsTrigger>
            <TabsTrigger value="lotes" className="font-bold py-2 rounded-lg">Lotes (FIFO/FEFO)</TabsTrigger>
         </TabsList>

         <TabsContent value="insumos" className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-text-secondary" />
                  <input className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foodify-orange" placeholder="Buscar insumo..." />
               </div>
               <Button variant="outline" className="h-10 rounded-xl font-bold gap-2">
                  <Filter className="w-4 h-4" /> Filtrar por categoría
               </Button>
            </div>

            <div className="bg-white dark:bg-zinc-950 border rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-zinc-900 border-b text-[10px] font-black uppercase text-text-secondary tracking-widest">
                     <tr>
                        <th className="px-6 py-4">Insumo</th>
                        <th className="px-6 py-4">Categoría</th>
                        <th className="px-6 py-4">Stock Actual</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                      {(items || []).map((item) => {
                         const isCritical = item.currentStock <= item.minStock;
                         return (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                           <td className="px-6 py-4 font-bold">{item.name}</td>
                           <td className="px-6 py-4 text-text-secondary">{item.category}</td>
                           <td className="px-6 py-4">
                              <span className="font-black">{item.currentStock}</span> {item.unit}
                              <p className="text-[10px] text-text-secondary">Min: {item.minStock} {item.unit}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className={cn(
                                 "inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                 !isCritical ? 'bg-green-100 text-green-600' :
                                 (item.currentStock / item.minStock) < 0.5 ? 'bg-red-100 text-red-600' :
                                 'bg-yellow-100 text-yellow-600'
                              )}>
                                 {!isCritical ? 'Suficiente' : (item.currentStock / item.minStock) < 0.5 ? 'Crítico' : 'Poco stock'}
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                           </td>
                        </tr>
                        );
                      })}
                  </tbody>
               </table>
            </div>
         </TabsContent>

         <TabsContent value="lotes" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {(items || []).flatMap(i => (i.batches || []).map(b => ({ ...b, itemName: i.name }))).map((lote) => (
                  <Card key={lote.id} className={cn(
                     "border-none shadow-sm overflow-hidden",
                     lote.status === 'expired' ? 'bg-red-50/50' : 'bg-white'
                  )}>
                     <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                           <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary">LOTE #{lote.id}</CardTitle>
                           <h4 className="font-bold">{lote.itemName}</h4>
                        </div>
                        <div className={cn(
                           "p-2 rounded-xl",
                           lote.status === 'expired' ? 'bg-red-500 text-white' : 'bg-green-100 text-green-600'
                        )}>
                           <Clock className="w-4 h-4" />
                        </div>
                     </CardHeader>
                     <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary">Cantidad</span>
                           <span className="font-bold underline">{lote.quantity}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary">Recibido</span>
                           <span className="font-medium">{lote.entryDate?.split('T')[0]}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                           <span className="text-text-secondary font-bold">Vencimiento</span>
                           <span className={cn("font-black", lote.status === 'expired' && "text-red-600")}>{lote.expiryDate?.split('T')[0] || "N/A"}</span>
                        </div>
                     </CardContent>
                     <CardFooter className="p-4 bg-black/[0.02] flex justify-between">
                        <Button variant="ghost" size="sm" className="text-[10px] font-black">Merma / Descarte</Button>
                        <Button size="sm" className="bg-foodify-orange text-white text-[10px] font-black h-8 px-4">Usar Lote</Button>
                     </CardFooter>
                  </Card>
               ))}
            </div>
         </TabsContent>
      </Tabs>
    </div>
  );
}
