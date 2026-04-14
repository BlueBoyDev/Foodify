"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Search,
  MoreVertical,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useFetchWithState } from "@/lib/useFetchWithState";
import { getSaasSubscriptionsApi, getSaasKpisApi } from "@/lib/saasApi";

export default function CodexSubscriptions() {
  const { data: kpi, loading: kpiLoading } = useFetchWithState("saas-kpis", () => getSaasKpisApi("month"), 15000);
  const { data: subData, loading: subsLoading } = useFetchWithState("saas-subscriptions", () => getSaasSubscriptionsApi(), 15000);

  const loading = kpiLoading || subsLoading;
  const subscriptions = subData?.items || [];
  const total = subData?.total || 0;

  return (
    <div className="space-y-8">
      {loading && !subData && (
        <div className="fixed inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodify-orange" />
        </div>
      )}
      <div>
        <h1 className="text-3xl font-black">Suscripciones</h1>
        <p className="text-white/40">Monitoreo de ingresos recurrentes y estados de cuenta.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 flex items-center gap-6 shadow-sm">
           <div className="p-4 bg-green-500/10 rounded-2xl text-green-500">
              <TrendingUp className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Revenue Mensual (MRR)</p>
              <h3 className="text-2xl font-black text-white">${(kpi?.monthlyRevenue ?? 0).toLocaleString()}</h3>
           </div>
        </div>
        <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 flex items-center gap-6 shadow-sm">
           <div className="p-4 bg-yellow-500/10 rounded-2xl text-yellow-500">
              <Calendar className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Próximos Cobros (7d)</p>
              <h3 className="text-2xl font-black text-white">12 Facturas</h3>
           </div>
        </div>
        <div className="bg-[#1C1C1E] p-6 rounded-2xl border border-white/5 flex items-center gap-6 shadow-sm">
           <div className="p-4 bg-red-500/10 rounded-2xl text-red-500">
              <AlertCircle className="w-6 h-6" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Total Suscripciones</p>
              <h3 className="text-2xl font-black text-white">{total} Activas</h3>
           </div>
        </div>
      </div>

      <Card className="bg-[#1C1C1E] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
             <input className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foodify-orange transition-all" placeholder="Buscar por restaurante..." />
          </div>
          <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold gap-2">
             <Filter className="w-4 h-4" /> Filtrar
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase text-white/40 tracking-widest border-b border-white/5">
                   <tr>
                      <th className="px-6 py-4">Restaurante</th>
                      <th className="px-6 py-4">Plan Actual</th>
                      <th className="px-6 py-4">Monto Mensual</th>
                      <th className="px-6 py-4">Siguiente Cobro</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                   {subscriptions.map((sub) => (
                     <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4 font-bold text-white">{sub.restaurantName}</td>
                        <td className="px-6 py-4">
                           <span className={cn(
                             "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                             sub.planName === 'Premium' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                           )}>
                             {sub.planName}
                           </span>
                        </td>
                        <td className="px-6 py-4 font-black">${Number(sub.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-white/60">
                           <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 opacity-30" />
                              {sub.nextPaymentDate ? sub.nextPaymentDate.split('T')[0] : 'Sin fecha'}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className={cn(
                             "flex items-center gap-2 font-black text-[10px] uppercase",
                             sub.status === 'active' ? 'text-green-400' : 'text-red-400'
                           )}>
                              {sub.status === 'active' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                              {sub.status === 'active' ? 'Al día' : 'Vencida'}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                           </Button>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
