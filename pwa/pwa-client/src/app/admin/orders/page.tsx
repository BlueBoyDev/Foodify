"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  ChefHat, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search,
  Filter,
  MoreVertical,
  User as UserIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchWithState } from "@/lib/useFetchWithState";
import { getActiveOrdersApi, updateOrderStatusApi } from "@/lib/ordersApi";
import type { OrderStatus } from "@/types/orders";
import toast from "react-hot-toast";

// Status map for UI badges
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  nuevo: { label: "Pendiente", class: "bg-orange-100 text-orange-600" },
  confirmado: { label: "Confirmado", class: "bg-blue-100 text-blue-600" },
  en_preparacion: { label: "En Cocina", class: "bg-yellow-100 text-yellow-600" },
  listo: { label: "Listo", class: "bg-green-100 text-green-600" },
  entregado: { label: "Entregado", class: "bg-gray-100 text-gray-600" },
  cancelado: { label: "Cancelado", class: "bg-red-100 text-red-600" },
};

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  nuevo: "confirmado",
  confirmado: "en_preparacion",
  en_preparacion: "listo",
  listo: "entregado",
  entregado: null,
  cancelado: null,
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: orders, loading, refetch } = useFetchWithState("active-orders", getActiveOrdersApi, 5000);

  const filteredOrders = !orders ? [] : activeTab === "all" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const handleNextStatus = async (id: string, current: string) => {
    const next = NEXT_STATUS[current];
    if (!next) return;
    try {
      await updateOrderStatusApi(id, next);
      toast.success("Estado actualizado");
      refetch();
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const getElapsedTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const now = new Date().getTime();
    return Math.floor((now - start) / 60000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Pedidos</h1>
          <p className="text-text-secondary">Monitorea y gestiona las órdenes en tiempo real.</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 border p-1 rounded-xl shadow-sm overflow-x-auto scrollbar-hide">
            <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
               <TabsList className="bg-transparent h-auto p-0 gap-1">
                 <TabsTrigger value="all" className="font-bold px-4 py-2 rounded-lg data-[state=active]:bg-foodify-orange data-[state=active]:text-white">
                   Todos <span className="ml-1 opacity-50">{orders?.length || 0}</span>
                 </TabsTrigger>
                 <TabsTrigger value="nuevo" className="font-bold px-4 py-2 rounded-lg data-[state=active]:bg-foodify-orange data-[state=active]:text-white">
                   Nuevos
                 </TabsTrigger>
                 <TabsTrigger value="en_preparacion" className="font-bold px-4 py-2 rounded-lg data-[state=active]:bg-foodify-orange data-[state=active]:text-white">
                   Cocina
                 </TabsTrigger>
                 <TabsTrigger value="listo" className="font-bold px-4 py-2 rounded-lg data-[state=active]:bg-foodify-orange data-[state=active]:text-white">
                   Listos
                 </TabsTrigger>
               </TabsList>
            </Tabs>
         </div>
      </div>

      {loading && !orders && (
        <div className="flex justify-center p-12">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foodify-orange" />
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <Card className="p-12 text-center flex flex-col items-center gap-4">
           <ShoppingBag className="w-12 h-12 text-gray-200" />
           <p className="text-text-secondary font-bold">No hay pedidos en esta categoría</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="relative overflow-hidden group hover:border-foodify-orange transition-all">
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg">
                       {order.tableId ? `Mesa ${order.tableId}` : 'Para Llevar'}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium uppercase tracking-wider mt-1">
                       <span>Folio #{order.folio}</span>
                       <span>•</span>
                       <span className="flex items-center gap-1 font-bold text-foodify-orange">
                         <Clock className="w-3 h-3" /> {getElapsedTime(order.createdAt)} min
                       </span>
                    </div>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                    STATUS_CONFIG[order.status]?.class
                  )}>
                    {STATUS_CONFIG[order.status]?.label || order.status}
                  </div>
               </div>

               <div className="space-y-3 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                       <span className="text-text-primary font-medium">
                         <span className="font-black text-foodify-orange mr-2">{item.qty}x</span>
                         {item.dishName}
                       </span>
                       <span className="font-black">${(item.unitPrice || 0).toFixed(2)}</span>
                    </div>
                  ))}
               </div>

               <div className="pt-4 border-t border-dashed flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary">
                        <UserIcon className="w-4 h-4" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-text-secondary uppercase">Atendido por</span>
                        <span className="text-xs font-bold leading-tight">{order.attendedBy || '—'}</span>
                     </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-text-secondary uppercase">Total</p>
                    <p className="text-lg font-black text-foodify-orange">
                      ${(order.items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0)).toFixed(2)}
                    </p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="font-black text-xs h-10 rounded-xl">Detalle</Button>
                  <Button 
                    disabled={!NEXT_STATUS[order.status]}
                    onClick={() => handleNextStatus(order.id, order.status)}
                    className="bg-foodify-orange text-white font-black text-xs h-10 rounded-xl"
                  >
                    {NEXT_STATUS[order.status] ? 'Sig. Estado' : 'Finalizado'}
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
