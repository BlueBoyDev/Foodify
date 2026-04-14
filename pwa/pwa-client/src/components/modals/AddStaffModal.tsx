"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StaffRole } from "@/types/staff";
import { createStaffApi } from "@/lib/staffApi";
import toast from "react-hot-toast";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "waiter" as StaffRole,
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createStaffApi(formData);
      toast.success("Empleado agregado exitosamente");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "waiter",
        password: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al agregar empleado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nuevo Empleado">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Nombre Completo</label>
          <Input 
            required
            placeholder="Ej. Juan Pérez"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Email</label>
            <Input 
              required
              type="email"
              placeholder="juan@foodify.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Teléfono</label>
            <Input 
              required
              placeholder="5512345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Rol</label>
          <select 
            className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
          >
            <option value="waiter">Mesero</option>
            <option value="chef">Chef / Cocina</option>
            <option value="cashier">Cajero</option>
            <option value="manager">Gerente</option>
            <option value="restaurant_admin">Administrador</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Contraseña Inicial</label>
          <Input 
            required
            type="password"
            placeholder="********"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Guardar Empleado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
