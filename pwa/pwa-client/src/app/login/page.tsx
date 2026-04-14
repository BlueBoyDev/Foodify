import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";
import Image from "next/image";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* Columna Izquierda - Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-foodify-orange overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="relative z-20 flex flex-col justify-between p-12 text-white w-full">
          <Logo variant="foodify" className="text-white" />
          <div className="space-y-4">
            <h1 className="text-5xl font-black">Gestiona tu restaurante con inteligencia.</h1>
            <p className="text-xl text-white/80">
              Controla pedidos, inventarios y staff desde un solo lugar.
            </p>
          </div>
          <p className="text-sm text-white/60">
            Powered by Foodify · © 2026
          </p>
        </div>
        {/* Usamos el fondo generado */}
        <Image
          src="/brand/hero-bg.png"
          alt="Restaurant Background"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-app">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo />
          </div>
          <LoginForm 
            title="Panel Administrativo" 
            role="restaurant_admin" 
            redirectPath="/admin/dashboard" 
          />
        </div>
      </div>
    </div>
  );
}
