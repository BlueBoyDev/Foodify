"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createCategoryApi } from "@/lib/menuApi";
import toast from "react-hot-toast";

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menus: { id: string; name: string }[];
}

export function AddCategoryModal({ isOpen, onClose, onSuccess, menus }: AddCategoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [menuId, setMenuId] = useState(menus[0]?.id || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuId && menus.length > 0) return;
    
    setLoading(true);
    try {
      await createCategoryApi(menuId || menus[0].id, name);
      toast.success("Categoría creada exitosamente");
      onSuccess();
      onClose();
      setName("");
    } catch (error: any) {
      toast.error("Error al crear categoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Categoría">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Asignar al Menú</label>
          <select 
            required
            className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none"
            value={menuId}
            onChange={(e) => setMenuId(e.target.value)}
          >
            {menus.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Nombre de la Categoría</label>
          <Input 
            required
            placeholder="Ej. Entradas, Postres, Bebidas..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Crear Categoría"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
