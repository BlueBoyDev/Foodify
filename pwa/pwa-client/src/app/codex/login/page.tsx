import React from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Logo } from "@/components/ui/Logo";

export default function CodexLoginPage() {
  return (
    <div className="flex min-h-screen bg-[#1C1C1E]">
      {/* Columna Izquierda - Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white border-r border-white/5">
        <Logo variant="codex" />
        <div className="space-y-4">
          <h1 className="text-5xl font-black">Panel CODEX</h1>
          <p className="text-xl text-white/60">
            Administración centralizada de la plataforma Foodify SaaS.
          </p>
        </div>
        <p className="text-sm text-white/40">
          SaaS Admin Panel v3.2
        </p>
      </div>

      {/* Columna Derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-[#111111]">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <Logo variant="codex" />
          </div>
          <LoginForm 
            title="Panel CODEX" 
            role="saas_admin" 
            redirectPath="/codex/dashboard" 
          />
        </div>
      </div>
    </div>
  );
}
