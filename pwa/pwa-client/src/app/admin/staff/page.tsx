"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
  Plus, 
  Mail, 
  Phone, 
  Edit3, 
  MoreVertical,
  Search,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

import { useFetchWithState } from "@/lib/useFetchWithState";
import { getStaffApi, updateStaffStatusApi } from "@/lib/staffApi";
import { AddStaffModal } from "@/components/modals/AddStaffModal";

const roleConfig: any = {
  restaurant_admin: { label: "Admin", color: "bg-orange-100 text-orange-600 border-orange-200" },
  waiter: { label: "Mesero", color: "bg-blue-100 text-blue-600 border-blue-200" },
  chef: { label: "Cocina", color: "bg-green-100 text-green-600 border-green-200" },
  cashier: { label: "Cajero", color: "bg-purple-100 text-purple-600 border-purple-200" },
};

export default function AdminStaffPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { 
    data: staff, 
    loading, 
    refetch 
  } = useFetchWithState("staff", getStaffApi, 15000);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateStaffStatusApi(id, newStatus as any);
      toast.success("Estado actualizado");
      refetch();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  return (
    <div className="space-y-8 font-outfit">
      {loading && !staff && (
        <div className="fixed inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foodify-orange" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Equipo de Staff</h1>
          <p className="text-text-secondary">Gestiona el equipo y permisos de tu restaurante.</p>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-foodify-orange hover:bg-foodify-orange-dark text-white font-black h-12 px-8 rounded-2xl shadow-lg shadow-foodify-orange/20 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" />
          Agregar empleado
        </Button>
      </div>

      <AddStaffModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => refetch()} 
      />

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-foodify-orange transition-colors" />
        <input 
          type="text" 
          placeholder="Buscar empleado por nombre o email..." 
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-border rounded-2xl focus:ring-2 focus:ring-foodify-orange/20 focus:outline-none transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {(staff || []).map((employee) => (
          <Card key={employee.id} className="group hover:border-foodify-orange transition-all overflow-hidden rounded-3xl border-2">
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-foodify-orange-light dark:bg-zinc-800 text-foodify-orange font-black text-xl flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm capitalize">
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-sm",
                      employee.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'
                    )}>
                       {employee.status === 'active' ? <CheckCircle2 className="w-3 h-3 text-white" /> : <XCircle className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-foodify-orange rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
               </div>

               <div className="space-y-1 mb-6">
                  <h3 className="font-black text-lg leading-tight text-text-primary dark:text-white truncate">{employee.name}</h3>
                  <div className={cn(
                    "inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider",
                    roleConfig[employee.role]?.color || "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    {roleConfig[employee.role]?.label || employee.role}
                  </div>
               </div>

               <div className="space-y-3 pb-6 border-b border-dashed dark:border-zinc-800">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                     <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <Mail className="w-4 h-4 text-foodify-orange/60" />
                     </div>
                     <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                     <div className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                        <Phone className="w-4 h-4 text-foodify-orange/60" />
                     </div>
                     <span>{employee.phone}</span>
                  </div>
               </div>

               <div className="pt-5 flex items-center justify-between">
                  <Button variant="ghost" className="text-xs font-black gap-2 hover:bg-foodify-orange-light hover:text-foodify-orange rounded-xl px-4">
                     <Edit3 className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "text-xs font-black rounded-xl px-4",
                      employee.status === 'active' ? 'text-gray-400 hover:text-red-500' : 'text-emerald-500 hover:bg-emerald-50'
                    )}
                    onClick={() => toggleStatus(employee.id, employee.status)}
                  >
                    {employee.status === 'active' ? 'Desactivar' : 'Activar'}
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
