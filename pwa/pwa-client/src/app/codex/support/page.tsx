"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  LifeBuoy, 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Store,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  MoreVertical,
  Reply
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const MOCK_TICKETS = [
  { id: 1, restaurant: "Foodify Gourmet", issue: "Error en sincronización de inventario", priority: "P1", status: "open", time: "2h" },
  { id: 2, restaurant: "Tacos El Guero", issue: "Duda sobre facturación Premium", priority: "P2", status: "open", time: "5h" },
  { id: 3, restaurant: "Sushi House", issue: "Solicitud de cambio de slug", priority: "P3", status: "resolved", time: "1d" },
  { id: 4, restaurant: "La Pizzeria", issue: "No carga imagen Hero", priority: "P2", status: "open", time: "8h" },
];

const priorityColors: any = {
  P1: "bg-red-500/10 text-red-500 border-red-500/20",
  P2: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  P3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function CodexSupportPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Soporte & Tickets</h1>
          <p className="text-white/40">Atención técnica a socios y resolución de incidencias.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LISTA DE TICKETS */}
        <Card className="lg:col-span-2 bg-[#1C1C1E] border-white/5 pb-6">
           <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
              <div className="relative w-full max-w-sm">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                 <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foodify-orange transition-all" placeholder="Buscar ticket..." />
              </div>
              <Button variant="ghost" size="icon" className="text-white/40"><MoreVertical className="w-5 h-5" /></Button>
           </CardHeader>
           <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                 {MOCK_TICKETS.map((ticket) => (
                   <div key={ticket.id} className="p-6 flex items-start justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group">
                      <div className="flex gap-4">
                         <div className={cn(
                           "flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center",
                           ticket.status === 'open' ? 'bg-foodify-orange/10 text-foodify-orange' : 'bg-green-500/10 text-green-500'
                         )}>
                            {ticket.status === 'open' ? <MessageSquare className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-3">
                               <h4 className="font-bold text-base group-hover:text-foodify-orange transition-colors">{ticket.issue}</h4>
                               <div className={cn("px-2 py-0.5 rounded border text-[10px] font-black", priorityColors[ticket.priority])}>
                                  {ticket.priority}
                               </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/40">
                               <span className="flex items-center gap-1 font-bold text-white/60"><Store className="w-3 h-3" /> {ticket.restaurant}</span>
                               <span>•</span>
                               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Hace {ticket.time}</span>
                            </div>
                         </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20 group-hover:translate-x-1 transition-all" />
                   </div>
                 ))}
              </div>
           </CardContent>
        </Card>

        {/* METRICAS DE SOPORTE */}
        <div className="space-y-6">
           <Card className="bg-[#1C1C1E] border-white/5">
              <CardHeader>
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40">Tiempo de Respuesta</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="text-3xl font-black">45 min</div>
                 <p className="text-xs text-green-400 mt-1 font-bold">12% más rápido que ayer</p>
                 <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-foodify-orange" style={{ width: '85%' }} />
                 </div>
              </CardContent>
           </Card>

           <Card className="bg-foodify-orange/5 border-foodify-orange/20 border">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                 <ShieldAlert className="w-10 h-10 text-foodify-orange" />
                 <div>
                    <h3 className="font-bold text-white">Tickets Críticos (P1)</h3>
                    <p className="text-xs text-white/60">Hay 1 ticket de alta prioridad esperando respuesta inmediata.</p>
                 </div>
                 <Button className="w-full bg-foodify-orange text-white font-black rounded-xl">Ver Crítico</Button>
              </CardContent>
           </Card>

           <Card className="bg-[#1C1C1E] border-white/5">
              <CardHeader>
                 <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40">Acciones Proactivas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 <Button variant="ghost" className="w-full justify-between text-xs font-bold hover:bg-white/5 text-white/60">
                    Enviar Broadcast Global <ChevronRight className="w-3 h-3" />
                 </Button>
                 <Button variant="ghost" className="w-full justify-between text-xs font-bold hover:bg-white/5 text-white/60">
                    Ver Base de Conocimientos <ChevronRight className="w-3 h-3" />
                 </Button>
                 <Button variant="ghost" className="w-full justify-between text-xs font-bold hover:bg-white/5 text-white/60">
                    Exportar Reporte Mensual <ChevronRight className="w-3 h-3" />
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
