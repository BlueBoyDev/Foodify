import { api } from "./api/axios";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  ownerId: string;
}

/**
 * Obtiene la lista de restaurantes que pertenecen al administrador actual.
 */
export async function getOwnedRestaurantsApi(): Promise<Restaurant[]> {
  try {
    const { data } = await api.get("/restaurants");
    // Soporta tanto Array directo, data.data, como data.data.items (v3.1/3.2)
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data.data) {
      if (Array.isArray(data.data)) list = data.data;
      else if (Array.isArray(data.data.items)) list = data.data.items;
    }

    return list.map((r: any) => ({
      ...r,
      id: String(r.id),
      slug: r.slug ?? "",
    }));
  } catch (e) {
    console.error("Error fetching owned restaurants:", e);
    throw e;
  }
}

/**
 * Obtiene los detalles de un restaurante específico por su ID.
 */
export async function getRestaurantDetailsApi(id: string): Promise<Restaurant> {
  const { data } = await api.get(`/restaurants/${id}`);
  const r = data.data ?? data;
  return {
    ...r,
    id: String(r.id),
    slug: r.slug ?? "",
  };
}

/**
 * Cambia el contexto del administrador a un nuevo restaurante.
 * Esto actualiza el campo restaurant_id en la tabla users para el usuario logueado.
 */
export async function switchActiveRestaurantApi(userId: string, restaurantId: string): Promise<void> {
  try {
    await api.patch(`/users/${userId}`, {
      restaurantId: parseInt(restaurantId, 10),
    });
  } catch (e) {
    console.error("Error switching restaurant:", e);
    throw e;
  }
}

/**
 * Actualiza los datos de un restaurante específico.
 */
export async function updateRestaurantApi(id: string, payload: Partial<Restaurant>): Promise<Restaurant> {
  const { data } = await api.put(`/restaurants/${id}`, payload);
  const r = data.data ?? data;
  return {
    ...r,
    id: String(r.id),
    slug: r.slug ?? "",
  };
}
