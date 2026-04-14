"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getOrderByFolioApi } from "@/lib/ordersApi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  QrCode, 
  RefreshCw, 
  ChevronLeft,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusSteps = [
  { id: "pending", label: "Recibido", customerLabel: "Recibido" },
  { id: "preparing", label: "En Cocina", customerLabel: "En cocina" },
  { id: "ready", label: "Listo", customerLabel: "Listo" },
  { id: "delivered", label: "Entregado", customerLabel: "Entregado" },
];

// Mapear estado interno a display status
function mapStatusToDisplayStatus(internalStatus: string): "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" {
  switch (internalStatus) {
    case "nuevo":
    case "confirmado":
      return "pending";
    case "en_preparacion":
      return "preparing";
    case "listo":
      return "ready";
    case "entregado":
      return "delivered";
    case "cancelado":
      return "cancelled";
    default:
      return "pending";
  }
}

export default function OrderTrackingPage() {
  const { slug, folio } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOrder = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      // Usar el endpoint correcto: GET /menu/:slug/order/:folio
      const internalOrder = await getOrderByFolioApi(slug as string, folio as string);
      if (internalOrder) {
        // Mapear Order interno a la estructura de display
        setOrder({
          id: Number(internalOrder.id),
          folio: internalOrder.folio,
          status: mapStatusToDisplayStatus(internalOrder.status),
          customerName: internalOrder.attendedBy || "Cliente",
          customerPhone: "",
          notes: "",
          total: internalOrder.items.reduce((sum: number, it: any) => sum + (it.unitPrice * it.qty), 0),
          qrCode: internalOrder.qrCode,
          createdAt: internalOrder.createdAt,
          items: internalOrder.items.map((it: any, idx: number) => ({
            id: idx,
            dishName: it.dishName,
            quantity: it.qty,
            price: it.unitPrice
          }))
        });
      } else {
        toast.error("No se pudo cargar la información del pedido");
      }
    } catch (error: any) {
      console.error("Error fetching order:", error);
      if (!quiet) toast.error("Error al obtener el estado del pedido");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [slug, folio]);

  useEffect(() => {
    fetchOrder();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchOrder(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchOrder]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-foodify-orange animate-spin" />
          <p className="text-text-secondary font-medium">Buscando tu pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center gap-4">
        <h1 className="text-xl font-bold">Pedido no encontrado</h1>
        <Button onClick={() => router.push(`/menu/${slug}`)}>Volver al menú</Button>
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.id === order.status);
  // Si el estado es 'confirmed', mapearlo a 'pending' para el tracking del usuario
  const activeIndex = order.status === "confirmed" ? 0 : currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div className="min-h-screen bg-app pb-20">
      <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/menu/${slug}`)}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-black">Seguimiento</span>
          <span className="font-bold"># {order.folio}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => fetchOrder(true)} disabled={isRefreshing}>
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-8">
        {/* CONFIRMATION HEADER */}
        {order.status === "pending" || order.status === "confirmed" ? (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full text-green-600 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black">¡Pedido recibido!</h2>
              <p className="text-text-secondary">Estamos preparando todo con mucho gusto.</p>
            </div>
          </div>
        ) : null}

        {/* TIMELINE */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white pb-2 flex flex-row items-center justify-between">
             <CardTitle className="text-sm font-black uppercase tracking-wider text-text-secondary">Estado actual</CardTitle>
             <div className="badge-preparing flex items-center gap-1.5 animate-pulse">
                <div className="w-2 h-2 bg-current rounded-full" />
                {statusSteps[activeIndex]?.customerLabel || "Procesando"}
             </div>
          </CardHeader>
          <CardContent className="pt-6 pb-8">
            <div className="relative flex justify-between">
              {/* Line background */}
              <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 -z-10" />
              {/* Progress line */}
              <div 
                className="absolute top-4 left-0 h-1 bg-foodify-orange -z-10 transition-all duration-1000" 
                style={{ width: `${(activeIndex / (statusSteps.length - 1)) * 100}%` }}
              />
              
              {statusSteps.map((step, idx) => {
                const isCompleted = idx < activeIndex;
                const isActive = idx === activeIndex;
                const isPending = idx > activeIndex;

                return (
                  <div key={step.id} className="flex flex-col items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                      isCompleted ? "bg-foodify-orange border-foodify-orange text-white" :
                      isActive ? "bg-white border-foodify-orange text-foodify-orange scale-110 shadow-lg shadow-foodify-orange/20" :
                      "bg-white border-gray-100 text-gray-300"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (idx + 1)}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-tighter sm:tracking-normal ${
                      isActive ? "text-foodify-orange" : "text-text-secondary"
                    }`}>
                      {step.customerLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
          <CardFooter className="bg-orange-50/50 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-foodify-orange font-bold text-sm">
              <Clock className="w-4 h-4" />
              Tiempo estimado: ~30 minutos
            </div>
          </CardFooter>
        </Card>

        {/* QR CODE SECTION */}
        <Card className="text-center p-8 space-y-4">
          <div className="mx-auto w-48 h-48 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center p-4">
            {order.qrCode ? (
              <Image src={order.qrCode} alt="Order QR" width={160} height={160} />
            ) : (
              <QrCode className="w-32 h-32 text-gray-100" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Tu código de retiro</h3>
            <p className="text-xs text-text-secondary">Muestra este código al personal del restaurante cuando llegues por tu pedido.</p>
          </div>
        </Card>

        {/* ORDER DETAILS */}
        <div className="space-y-4">
          <h3 className="font-black text-lg">Resumen de tu pedido</h3>
          <Card>
             <CardContent className="p-0 divide-y">
               {order.items.map((item: any) => (
                 <div key={item.id} className="p-4 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{item.dishName}</span>
                      <span className="text-text-secondary text-xs">{item.quantity} x ${item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                 </div>
               ))}
             </CardContent>
             <CardFooter className="flex-col gap-3 pt-4">
                <div className="w-full flex justify-between items-center text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium">${(order.total / 1.16).toFixed(2)}</span>
                </div>
                <div className="w-full h-px bg-gray-100" />
                <div className="w-full flex justify-between items-center font-black text-lg">
                  <span className="text-text-primary">Total</span>
                  <span className="text-foodify-orange">${order.total.toFixed(2)}</span>
                </div>
             </CardFooter>
          </Card>
        </div>

        {/* CUSTOMER INFO */}
        <div className="space-y-4">
          <h3 className="font-black text-lg">Información de entrega</h3>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Cliente</p>
                  <p className="font-bold">{order.customerName}</p>
                  <p className="text-sm text-text-secondary">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-text-secondary shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Fecha del pedido</p>
                  <p className="font-bold">{format(new Date(order.createdAt), "PPP p", { locale: es })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="pt-4 text-center">
          <Button variant="outline" className="rounded-full gap-2 border-gray-200" onClick={() => router.push(`/menu/${slug}`)}>
            Ir al inicio <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
