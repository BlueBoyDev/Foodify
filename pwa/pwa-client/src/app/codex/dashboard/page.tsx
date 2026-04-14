"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { 
  Store, 
  Plus, 
  Search, 
  MoreVertical, 
  TrendingUp, 
  Users, 
  CreditCard, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { 
  getSaasKpisApi, 
  getSaasRestaurantsApi, 
  updateSaasSubscriptionStatusApi 
} from "@/lib/saasApi";
import { SaasKpi, SaasRestaurant } from "@/types/saas";
import { FoodSpinner } from "@/components/ui/FoodSpinner";

export default function CodexDashboard() {
  const [restaurants, setRestaurants] = useState<SaasRestaurant[]>([]);
  const [kpis, setKpis] = useState<SaasKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiData, resData] = await Promise.all([
        getSaasKpisApi(),
        getSaasRestaurantsApi({ search: searchTerm })
      ]);
      setKpis(kpiData);
      setRestaurants(resData.items);
    } catch (error) {
      toast.error("Error al cargar datos de la plataforma");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateSaasSubscriptionStatusApi(id, newStatus);
      toast.success("Estado actualizado");
      fetchData();
    } catch (error) {
      toast.error("No se pudo cambiar el estado");
    }
  };

  if (loading && !kpis) {
    return <div className="h-[60vh] flex items-center justify-center"><FoodSpinner /></div>;
  }

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Restaurantes</h1>
          <p className="text-white/40">Gestión de socios de la plataforma Foodify.</p>
        </div>
        
        <Button className="bg-foodify-orange text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-foodify-orange/20">
          <Plus className="w-5 h-5 mr-2" />
          Registrar Restaurante
        </Button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItemCodex 
           icon={Store} 
           label="Total Restaurantes" 
           value={kpis?.totalRestaurants ?? "0"} 
           trend={`${kpis?.growthPercentage ?? 0}% crec.`} 
           trendColor="text-foodify-orange" 
        />
        <KPIItemCodex 
           icon={TrendingUp} 
           label="MRR Estimado" 
           value={`$${(kpis?.monthlyRevenue ?? 0).toLocaleString()}`} 
           trend="Ingresos mensuales" 
           trendColor="text-green-400" 
        />
        <KPIItemCodex 
           icon={CreditCard} 
           label="Suscrip. Activas" 
           value={kpis?.activeSubscriptions ?? "0"} 
           trend="Planes vigentes" 
           trendColor="text-blue-400" 
        />
        <KPIItemCodex 
           icon={TrendingUp} 
           label="Pedidos Totales" 
           value={kpis?.totalOrders ?? "0"} 
           trend="En la red" 
           trendColor="text-purple-400" 
        />
      </div>

      {/* RESTAURANTS LIST */}
      <Card className="bg-[#1C1C1E] border-white/5">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
             <input 
               className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-foodify-orange transition-all" 
               placeholder="Buscar por nombre o slug..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold">Plan</Button>
             <Button variant="outline" className="h-10 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold">Estado</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] font-black uppercase text-white/40 tracking-widest border-b border-white/5">
                   <tr>
                      <th className="px-6 py-4">Restaurante / Slug</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4">Fecha Alta</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                   {restaurants.map((res) => (
                     <tr key={res.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black">
                                 {res.name.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-bold text-sm">{res.name}</span>
                                 <span className="text-[10px] text-white/40">{res.slug}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className={cn(
                             "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase",
                             res.planName === 'Premium' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                             res.planName === 'Pro' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                             'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                           )}>
                             {res.planName}
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span className={cn(
                                "text-[10px] font-black uppercase",
                                res.status === 'active' ? 'text-green-400' : 'text-red-400'
                               )}>
                                {res.status === 'active' ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                              <Switch 
                                checked={res.status === 'active'} 
                                className="scale-75"
                                onCheckedChange={() => toggleStatus(res.id, res.status)}
                               />
                           </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white/60">
                           {new Date(res.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => window.open(`/menu/${res.slug}`, '_blank')}>
                                 <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white">
                                 <MoreVertical className="w-4 h-4" />
                              </Button>
                           </div>
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

function KPIItemCodex({ icon: Icon, label, value, trend, trendColor }: any) {
  return (
    <Card className="bg-[#1C1C1E] border-white/5 hover:border-foodify-orange/30 transition-all cursor-default">
      <CardContent className="p-6">
        <Icon className="w-8 h-8 text-foodify-orange/20 mb-4" />
        <CardDescription className="text-[10px] font-black uppercase tracking-widest text-white/40">{label}</CardDescription>
        <div className="flex items-end justify-between mt-1">
           <CardTitle className="text-2xl font-black">{value}</CardTitle>
           <span className={cn("text-[10px] font-bold", trendColor)}>{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}
