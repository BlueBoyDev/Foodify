"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dish, Category } from "@/types/menu";
import { createDishApi } from "@/lib/menuApi";
import toast from "react-hot-toast";

interface AddDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export function AddDishModal({ isOpen, onClose, onSuccess, categories }: AddDishModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Dish>>({
    name: "",
    price: 0,
    prepTime: 15,
    description: "",
    categoryId: categories[0]?.id || "",
    isAvailable: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId && categories.length > 0) {
      formData.categoryId = categories[0].id;
    }
    
    setLoading(true);
    try {
      await createDishApi(formData);
      toast.success("Platillo creado exitosamente");
      onSuccess();
      onClose();
      setFormData({
        name: "",
        price: 0,
        prepTime: 15,
        description: "",
        categoryId: categories[0]?.id || "",
        isAvailable: true,
      });
    } catch (error: any) {
      toast.error("Error al crear platillo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Platillo">
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Nombre del Platillo</label>
          <Input 
            required
            placeholder="Ej. Tacos al Pastor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Precio ($)</label>
            <Input 
              required
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Preparación (min)</label>
            <Input 
              required
              type="number"
              value={formData.prepTime}
              onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Categoría</label>
          <select 
            required
            className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="" disabled>Seleccionar categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Descripción</label>
          <textarea 
            className="w-full bg-white dark:bg-zinc-900 border border-border rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-foodify-orange focus:outline-none min-h-[80px]"
            placeholder="Ingredientes, alérgenos..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Crear Platillo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
