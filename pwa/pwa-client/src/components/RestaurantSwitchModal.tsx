"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { getOwnedRestaurantsApi, switchActiveRestaurantApi, getRestaurantDetailsApi, Restaurant } from "@/lib/restaurantApi";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "./RestaurantSwitchModal.module.css";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantSwitchModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getOwnedRestaurantsApi()
        .then(setRestaurants)
        .catch(() => toast.error("Error al cargar sucursales"))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSwitch = async (restaurant: Restaurant) => {
    if (!user) return;
    if (String(restaurant.id) === String(user.restaurantId || "")) {
      onClose();
      return;
    }

    setSwitching(restaurant.id);
    try {
      await switchActiveRestaurantApi(String(user.id), String(restaurant.id));
      
      // Obtener detalles frescos (slug, branch name) antes de recargar
      const details = await getRestaurantDetailsApi(String(restaurant.id));
      
      toast.success(`Cambiando a ${details.name || restaurant.name}...`);
      
      // Actualizar la sesión local inmediatamente
      const raw = localStorage.getItem("foodify_session");
      if (raw) {
        const session = JSON.parse(raw);
        session.user.restaurantId = restaurant.id;
        session.user.branch = details.name || restaurant.name;
        session.user.slug = details.slug || "";
        localStorage.setItem("foodify_session", JSON.stringify(session));
      }

      // Recargar para refrescar el contexto global
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (e) {
      console.error("Switch error:", e);
      toast.error("No se pudo cambiar de sucursal");
      setSwitching(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mis Sucursales">
      <div className={styles.container}>
        <p className={styles.description}>
          Selecciona la sucursal que deseas gestionar en este momento.
        </p>

        {loading ? (
          <div className="py-10 flex items-center justify-center text-gray-400 italic">
            Cargando sucursales...
          </div>
        ) : (
          <div className={styles.list}>
            {restaurants.map((r) => {
              const isActive = user && String(user.restaurantId) === String(r.id);
              return (
                <div
                  key={r.id}
                  className={`${styles.item} ${isActive ? styles.active : ""}`}
                  onClick={() => !switching && handleSwitch(r)}
                >
                  <div className={styles.info}>
                    <p className={styles.name}>{r.name}</p>
                    <p className={styles.address}>{r.address || "Sin dirección"}</p>
                  </div>
                  {switching === r.id ? (
                    <div className="animate-spin h-5 w-5 border-2 border-foodify-orange border-t-transparent rounded-full" />
                  ) : isActive ? (
                    <span className={styles.currentBadge}>Actual</span>
                  ) : (
                    <Button size="sm" variant="ghost">Seleccionar</Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
