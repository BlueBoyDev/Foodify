"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createLotApi } from "@/lib/inventoryApi";
import { Ingredient } from "@/types/inventory";
import toast from "react-hot-toast";

interface AddLotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: Ingredient[];
}

export function AddLotModal({ isOpen, onClose, onSuccess, items }: AddLotModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemId: items[0]?.id || "",
    quantity: 0,
    unitCost: 0,
    expiryDate: "",
    lotNumber: "",
    supplier: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemId && items.length > 0) formData.itemId = items[0].id;
    
    setLoading(true);
    try {
      await createLotApi(formData.itemId, {
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        expiryDate: formData.expiryDate || undefined,
        lotNumber: formData.lotNumber || undefined,
        supplier: formData.supplier || undefined,
      });
      toast.success("Entrada de stock registrada");
      onSuccess();
      onClose();
    } catch {
      toast.error("Error al registrar lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entrada de Mercancía (Lote)">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Seleccionar Insumo</label>
          <select 
            required
            className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none"
            value={formData.itemId}
            onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
          >
            <option value="" disabled>Seleccione un item...</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Cantidad recibida</label>
            <Input 
              required
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Costo Unitario ($)</label>
            <Input 
              required
              type="number"
              step="0.01"
              value={formData.unitCost}
              onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary"># de Lote / Factura</label>
            <Input 
              placeholder="Ej. F-9921"
              value={formData.lotNumber}
              onChange={(e) => setFormData({ ...formData, lotNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Vencimiento (Opcional)</label>
            <Input 
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Proveedor</label>
          <Input 
            placeholder="Nombre del proveedor..."
            value={formData.supplier}
            onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Registrar Entrada"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
