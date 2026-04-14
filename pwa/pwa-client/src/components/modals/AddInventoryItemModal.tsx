"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createInventoryItemApi } from "@/lib/inventoryApi";
import toast from "react-hot-toast";

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddInventoryItemModal({ isOpen, onClose, onSuccess }: AddInventoryItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    minStock: 5,
    category: "General",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInventoryItemApi(formData);
      toast.success("Insumo creado exitosamente");
      onSuccess();
      onClose();
      // Reset
      setFormData({ name: "", unit: "kg", minStock: 5, category: "General" });
    } catch {
      toast.error("Error al crear insumo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Insumo">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Nombre del Insumo</label>
          <Input 
            required
            placeholder="Ej. Jitomate Bola"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Unidad</label>
            <select 
              className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="kg">Kilogramos (kg)</option>
              <option value="gr">Gramos (gr)</option>
              <option value="lt">Litros (lt)</option>
              <option value="pz">Piezas (pz)</option>
              <option value="paq">Paquete (paq)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Stock Mínimo (Alerta)</label>
            <Input 
              required
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Categoría</label>
          <Input 
            required
            placeholder="Ej. Verduras, Carnes, Abarrotes"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Crear Insumo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
