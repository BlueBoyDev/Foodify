"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Check,
  Save,
  BarChart3,
  User as UserIcon,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import { Logo } from "@/components/ui/Logo";
import { useAuthStore } from "@/store/authStore";
import { getRestaurantDetailsApi, updateRestaurantApi } from "@/lib/restaurantApi";
import { useFetchWithState } from "@/lib/useFetchWithState";

export default function AdminConfigPage() {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  
  const { data: restaurant, loading, refetch } = useFetchWithState(
    "restaurant-config", 
    () => user?.restaurantId ? getRestaurantDetailsApi(String(user.restaurantId)) : Promise.reject(),
    60000
  );

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    slug: "",
    // Extendable for more fields...
  });

  // Sync form with loaded data
  React.useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        address: restaurant.address || "",
        slug: restaurant.slug || "",
      });
    }
  }, [restaurant]);

  const handleSave = async () => {
    if (!user?.restaurantId) return;
    setIsSaving(true);
    try {
      await updateRestaurantApi(String(user.restaurantId), formData);
      toast.success("Configuración guardada exitosamente");
      refetch();
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black">Configuración</h1>
        <p className="text-text-secondary">Personaliza tu restaurante y gestiona tu cuenta.</p>
      </div>

      <Tabs defaultValue="restaurant" className="space-y-6">
        <TabsList className="bg-white dark:bg-zinc-900 border p-1 rounded-xl w-full sm:w-auto h-auto grid grid-cols-3">
          <TabsTrigger value="restaurant" className="font-bold py-2 rounded-lg">Restaurante</TabsTrigger>
          <TabsTrigger value="dashboard" className="font-bold py-2 rounded-lg">Dashboard</TabsTrigger>
          <TabsTrigger value="account" className="font-bold py-2 rounded-lg">Cuenta</TabsTrigger>
        </TabsList>

        {/* TAB DATOS DEL RESTAURANTE */}
        <TabsContent value="restaurant" className="space-y-8 pb-32">
          {/* Imágenes y Logo */}
          <section className="space-y-4">
            <h2 className="text-lg font-black flex items-center gap-2">
               <ImageIcon className="w-5 h-5 text-foodify-orange" />
               Imagen y Logo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="md:col-span-1">
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                       <Logo className="scale-75" />
                    </div>
                    <div className="text-center">
                       <Button variant="outline" size="sm" className="font-bold h-8">Cambiar Logo</Button>
                       <p className="text-[10px] text-text-secondary mt-2">Recomendado: 512x512px</p>
                    </div>
                  </CardContent>
               </Card>
               <Card className="md:col-span-2">
                  <CardContent className="p-6">
                    <div className="w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center">
                       <div className="flex flex-col items-center gap-2 text-text-secondary">
                          <ImageIcon className="w-8 h-8 opacity-20" />
                          <span className="text-xs font-bold uppercase tracking-widest opacity-40">Subir imagen Hero (Portada)</span>
                       </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                       <p className="text-[10px] text-text-secondary">Esta imagen aparecerá en el menú digital del comensal.</p>
                       <Button variant="outline" size="sm" className="font-bold h-8">Subir imagen</Button>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </section>

          {/* Información Básica */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <Store className="w-4 h-4" /> Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resName">Nombre del restaurante *</Label>
                  <Input 
                    id="resName" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resDesc">Descripción</Label>
                  <textarea 
                    id="resDesc" 
                    className="w-full h-24 p-3 text-sm rounded-md border border-input bg-transparent focus:ring-1 focus:ring-ring focus:outline-none transition-all resize-none"
                    placeholder="Escribe una breve descripción para tus clientes..."
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="resSlug">Slug de URL</Label>
                   <div className="flex items-center gap-1 bg-gray-50 dark:bg-zinc-800 border rounded-md px-3">
                      <span className="text-xs text-text-secondary">foodify.mx/menu/</span>
                      <Input 
                        id="resSlug" 
                        value={formData.slug} 
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="border-none bg-transparent h-9 px-0 shadow-none focus-visible:ring-0" 
                      />
                   </div>
                 </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resAddr">Dirección completa</Label>
                  <Input 
                    id="resAddr" 
                    value={formData.address} 
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, Número, Colonia, Ciudad..." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resPhone">Teléfono</Label>
                    <Input id="resPhone" type="tel" placeholder="55 1234 5678" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resEmail">Email de contacto</Label>
                    <Input id="resEmail" type="email" placeholder="hola@tu-restaurante.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resHours">Horario de atención</Label>
                  <textarea 
                    id="resHours" 
                    className="w-full h-16 p-3 text-sm rounded-md border border-input bg-transparent focus:ring-1 focus:ring-ring focus:outline-none transition-all resize-none"
                    placeholder="Ej. Lun-Vie 12pm-10pm, Sáb-Dom 9am-11pm"
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Redes Sociales */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
                <Globe className="w-4 h-4" /> Redes Sociales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <Input placeholder="URL de Instagram" />
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-400" />
                    <Input placeholder="URL de Facebook" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Share2 className="w-5 h-5 text-gray-400" />
                    <Input placeholder="URL de Twitter / X" />
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                    <Input placeholder="Número de WhatsApp" />
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB DASHBOARD CONFIG */}
        <TabsContent value="dashboard" className="space-y-6 pb-32">
           <Card>
             <CardHeader>
                <CardTitle className="text-base font-black">Visualización de Gráficas</CardTitle>
                <CardDescription>Activa o desactiva las gráficas que aparecen en tu dashboard principal.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6 divide-y">
                {[
                  { id: "G1", title: "Ventas por período", desc: "Muestra los ingresos diarios en formato de barras o líneas." },
                  { id: "G2", title: "Top platillos más vendidos", desc: "Distribución porcentual de tus platillos estrella." },
                  { id: "G3", title: "Horas pico de pedidos", desc: "Identifica tus horarios de mayor demanda para optimizar staff." },
                  { id: "G4", title: "Ingresos por categoría", desc: "Análisis de qué tipos de comida generan más dinero." },
                  { id: "G5", title: "Platillos vendidos por menú", desc: "Tabla detallada de unidades vendidas e ingresos por ítem." },
                ].map((g) => (
                  <div key={g.id} className="flex items-center justify-between py-4 first:pt-0">
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm">{g.id} · {g.title}</p>
                      <p className="text-xs text-text-secondary">{g.desc}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
             </CardContent>
           </Card>
        </TabsContent>

        {/* TAB CUENTA */}
        <TabsContent value="account" className="space-y-6 pb-32">
           <Card>
             <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-foodify-orange text-white flex items-center justify-center text-xl font-black">
                   {user?.name?.charAt(0) || "A"}
                </div>
                <div>
                   <CardTitle className="text-xl font-black">{user?.name || "Administrador"}</CardTitle>
                   <CardDescription>{user?.email || "admin@foodify.mx"}</CardDescription>
                </div>
             </CardHeader>
             <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label>Cambiar contraseña</Label>
                      <Input type="password" placeholder="Contraseña actual" />
                   </div>
                   <div className="space-y-2">
                      <Label className="opacity-0">Confirmación</Label>
                      <Input type="password" placeholder="Nueva contraseña" />
                   </div>
                </div>
                <Button variant="outline" className="font-bold">Actualizar contraseña</Button>
             </CardContent>
             <CardFooter className="border-t pt-6">
                <Button variant="ghost" className="text-red-500 font-bold gap-2">
                  Cerrar sesión en todos los dispositivos
                </Button>
             </CardFooter>
           </Card>
        </TabsContent>
      </Tabs>

      {/* BOTON DE GUARDADO FLOTANTE/STICKY */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-foodify-orange text-white h-14 px-8 rounded-2xl shadow-2xl shadow-foodify-orange/30 font-black text-lg gap-3"
        >
          {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
