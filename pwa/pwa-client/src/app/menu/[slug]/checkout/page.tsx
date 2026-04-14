"use client";

import React, { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { api } from "@/lib/api/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { ArrowLeft, Loader2, CheckCircle2, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

const checkoutSchema = z.object({
  customerName: z.string().min(3, "El nombre es muy corto"),
  customerPhone: z.string().min(8, "Ingresa un teléfono válido"),
  notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialNotes = searchParams.get("notes") || "";
  
  const { items, getTotal, clearCart, getItemCount } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const subtotal = getTotal();
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { notes: initialNotes }
  });

  const onSubmit = async (values: CheckoutValues) => {
    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: "takeout",
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        notes: values.notes,
        items: items.map(item => ({
          dishId: item.id,
          quantity: item.quantity,
          specialNotes: "" // En una versión futura soportaríamos notas por item
        }))
      };

      const res = await api.post("/api/v1/orders", payload);
      const order = res.data.data;

      toast.success("¡Pedido realizado con éxito!");
      clearCart();
      router.push(`/menu/${slug}/order/${order.folio}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Error al crear el pedido");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (getItemCount() === 0) {
    return (
      <div className="min-h-screen bg-app flex flex-col items-center justify-center p-6 text-center gap-4">
        <CheckCircle2 className="w-16 h-16 text-gray-200" />
        <h1 className="text-xl font-bold">No hay productos en tu orden</h1>
        <Button onClick={() => router.push(`/menu/${slug}`)} variant="outline">
          Volver al menú
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <header className="bg-white border-b sticky top-0 z-10 px-4 h-16 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <span className="font-bold">Finalizar Pedido</span>
        <div className="w-10" />
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-black">Datos para tu pedido</h1>
          <p className="text-text-secondary text-sm">Por favor, ingresa tus datos para que podamos contactarte cuando tu orden esté lista.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Nombre completo *</Label>
                <Input 
                  id="customerName" 
                  placeholder="Ej. Juan Pérez"
                  {...register("customerName")}
                />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone">Número de teléfono *</Label>
                <Input 
                  id="customerPhone" 
                  placeholder="Ej. 55 1234 5678"
                  type="tel"
                  {...register("customerPhone")}
                />
                {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <textarea 
                  id="notes" 
                  className="w-full h-24 p-3 text-sm rounded-md border border-input bg-transparent focus:ring-1 focus:ring-ring focus:outline-none transition-all resize-none"
                  placeholder="Instrucciones adicionales para tu pedido..."
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <button 
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="w-full px-6 py-4 flex items-center justify-between border-b last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-foodify-orange" />
                <span className="font-bold text-sm">Resumen del pedido ({getItemCount()})</span>
              </div>
              {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showSummary && (
              <CardContent className="pt-4 divide-y">
                {items.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                    <div className="flex flex-col">
                      <span className="font-bold">{item.name}</span>
                      <span className="text-text-secondary text-xs">{item.quantity}x ${item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>IVA (16%)</span>
                    <span>${iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-base pt-2 text-text-primary">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            )}
            
            {!showSummary && (
              <CardFooter className="py-4 flex justify-between items-center text-sm">
                <span className="font-medium text-text-secondary">Total a pagar</span>
                <span className="font-black text-lg text-foodify-orange">${total.toFixed(2)}</span>
              </CardFooter>
            )}
          </Card>

          <Button 
            className="w-full h-14 bg-foodify-orange text-white text-lg font-black rounded-2xl shadow-lg shadow-foodify-orange/20"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando pedido...
              </>
            ) : (
              "Confirmar Pedido Para Llevar"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
}
