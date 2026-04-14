"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { 
  Settings2, 
  Server, 
  ShieldAlert, 
  Lock, 
  Globe, 
  Database,
  Cloud,
  Terminal,
  Save,
  RefreshCw,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function CodexGlobalConfig() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Configuración global guardada en red Codex");
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Configuración Global</h1>
        <p className="text-white/40">Parámetros maestros de la infraestructura Foodify SaaS.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API & ENDPOINTS */}
        <Card className="bg-[#1C1C1E] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
               <Server className="w-4 h-4 text-foodify-orange" />
               Endpoints de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/60">Base URL Producción</Label>
              <Input className="bg-white/5 border-white/10 text-white" defaultValue="https://api.foodify.mx/v1" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Base URL Staging</Label>
              <Input className="bg-white/5 border-white/10 text-white" defaultValue="https://staging.api.foodify.mx/v1" />
            </div>
            <div className="space-y-2">
              <Label className="text-white/60">Web-Socket Server</Label>
              <Input className="bg-white/5 border-white/10 text-white" defaultValue="wss://realtime.foodify.mx" />
            </div>
          </CardContent>
        </Card>

        {/* MANTENIMIENTO & SEGURIDAD */}
        <Card className="bg-[#1C1C1E] border-white/5">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
               <ShieldAlert className="w-4 h-4 text-red-500" />
               Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
               <div className="space-y-0.5">
                  <p className="font-bold text-sm text-red-400">Modo Mantenimiento Global</p>
                  <p className="text-[10px] text-white/40">Desactiva el acceso a todas las PWAs.</p>
               </div>
               <Switch className="data-[state=checked]:bg-red-500" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
               <div className="space-y-0.5">
                  <p className="font-bold text-sm">Registro Público de Restaurantes</p>
                  <p className="text-[10px] text-white/40">Permitir registro de nuevos socios desde la landing.</p>
               </div>
               <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
               <div className="space-y-0.5">
                  <p className="font-bold text-sm">Forzar Cierre de Sesiones</p>
                  <p className="text-[10px] text-white/40">Invalida todos los tokens JWT activos.</p>
               </div>
               <Button variant="ghost" className="text-xs font-black text-red-400 hover:bg-red-400/10">Ejecutar</Button>
            </div>
          </CardContent>
        </Card>

        {/* LIMITES DE INFRAESTRUCTURA */}
        <Card className="bg-[#1C1C1E] border-white/5 lg:col-span-2">
           <CardHeader>
             <CardTitle className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Límites & Cuotas
             </CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                 <Label className="text-white/60">Tamaño Máx. Imagen (MB)</Label>
                 <Input className="bg-white/5 border-white/10 text-white" type="number" defaultValue="5" />
              </div>
              <div className="space-y-4">
                 <Label className="text-white/60">Tasa de Polling (Segundos)</Label>
                 <Input className="bg-white/5 border-white/10 text-white" type="number" defaultValue="15" />
              </div>
              <div className="space-y-4">
                 <Label className="text-white/60">Días Histórico Logs</Label>
                 <Input className="bg-white/5 border-white/10 text-white" type="number" defaultValue="45" />
              </div>
           </CardContent>
           <CardFooter className="border-t border-white/5 justify-between">
              <p className="text-[10px] text-white/40">
                Al modificar estos valores, los cambios se propagarán a todos los nodos en la próxima purga de caché.
              </p>
              <Button onClick={handleSave} disabled={isSaving} className="bg-foodify-orange text-white font-black rounded-xl">
                 {isSaving ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                 Guardar Configuración Maestra
              </Button>
           </CardFooter>
        </Card>
      </div>
    </div>
  );
}
