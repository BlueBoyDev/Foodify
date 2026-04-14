"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTableApi } from "@/lib/tablesApi";
import toast from "react-hot-toast";

interface AddTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTableModal({ isOpen, onClose, onSuccess }: AddTableModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    number: "",
    seats: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createTableApi(formData);
      toast.success("Mesa agregada correctamente");
      onSuccess();
      onClose();
      setFormData({ number: "", seats: 4 });
    } catch {
      toast.error("Error al crear mesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Nueva Mesa">
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Identificador / Número</label>
          <Input 
            required
            placeholder="Ej. T-1 o 5"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-text-secondary">Capacidad (Personas)</label>
          <Input 
            required
            type="number"
            value={formData.seats}
            onChange={(e) => setFormData({ ...formData, seats: parseInt(e.target.value) })}
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-foodify-orange text-white font-bold" disabled={loading}>
            {loading ? "Guardando..." : "Crear Mesa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
