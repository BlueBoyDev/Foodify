import { publicApi, api } from "./api/axios";
import { type Dish, type Category, type PublicMenu } from "../types/menu";

export const RESTAURANT_SLUG = "demo-premium";

function mapDish(d: any, categoryId?: string): Dish {
  const rawImages = Array.isArray(d.images) ? d.images : (d.imageUrl ? [d.imageUrl] : []);
  const images: string[] = rawImages.map((img: any) => 
    typeof img === "string" ? img : (img.url ?? img.imageUrl ?? "")
  ).filter(Boolean);

  return {
    id: String(d.id),
    name: d.name,
    description: d.description ?? "",
    price: Number(d.price),
    prepTime: Number(d.prepTimeMin ?? d.prep_time_min ?? 15),
    imageUrl: images[0] ?? "",
    images: images,
    isAvailable: Boolean(d.isAvailable ?? d.is_active ?? true),
    categoryId: String(categoryId ?? d.categoryId ?? d.category_id ?? d.category?.id ?? ""),
    soldCount: Number(d.soldCount ?? d.sold_count ?? 0),
    allergens: Array.isArray(d.allergens) ? d.allergens : [],
    badge: d.badge ?? undefined,
  };
}

export async function fetchPublicMenu(slug: string = RESTAURANT_SLUG, mode: "takeout" | "dine_in" = "takeout"): Promise<{
  menus: PublicMenu[];
  restaurant: { id: number; name: string; logoUrl?: string; isOpen: boolean };
}> {
  console.log(`[Menu] Fetching public menu for slug: "${slug}", mode: "${mode}"`);
  const { data } = await publicApi.get(`/menu/${slug}`, { params: { mode } });
  const { restaurant, menus } = data.data;

  const mappedMenus: PublicMenu[] = (menus ?? []).map((m: any) => ({
    id: String(m.id),
    name: m.name,
    isActiveNow: Boolean(m.isActiveNow),
    isActive: Boolean(m.isActive ?? true),
    isOrderableNow: Boolean(m.isOrderableNow),
    availabilityNote: m.availabilityNote,
    categories: (m.categories ?? []).filter((c: any) => c.isActive !== false).map((c: any) => ({
      id: String(c.id),
      name: c.name,
      emoji: c.icon ?? c.emoji ?? "tag",
      dishes: (c.dishes ?? [])
        .filter((d: any) => !d.deletedAt && (d.is_active !== false && d.isAvailable !== false))
        .map((d: any) => mapDish(d, String(c.id))),
    })),
  }));

  const isRestaurantOpen = mappedMenus.some(m => m.isActiveNow);

  return {
    menus: mappedMenus,
    restaurant: {
      id: Number(restaurant?.id ?? 2),
      name: restaurant?.name ?? "Foodify",
      logoUrl: restaurant?.logoUrl,
      isOpen: isRestaurantOpen,
    },
  };
}

// ─── PUBLIC ACCESS TO ALL DISHES (Backup) ───────────────────────────────────

export async function getPublicDishesApi(): Promise<Dish[]> {
  const { data } = await publicApi.get("/dishes");
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map((d: any) => mapDish(d));
}

// ─── ADMIN: Platillos CRUD ──────────────────────────────────────────────────

export async function getAdminCategoriesApi(): Promise<Category[]> {
  const { data: menuData } = await api.get("/menus");
  const menus = Array.isArray(menuData.data) ? menuData.data : menuData.data?.items ?? [];
  const categories: Category[] = [];
  
  for (const m of menus) {
    try {
      const { data: catData } = await api.get(`/menus/${m.id}/categories`);
      const cats = Array.isArray(catData.data) ? catData.data : catData.data?.items ?? [];
      for (const c of cats) {
        categories.push({
          id: String(c.id),
          name: c.name,
          emoji: c.icon ?? c.emoji ?? "tag"
        });
      }
    } catch {
      // Continue if one menu fails
    }
  }
  return categories;
}

export async function getDishesApi(): Promise<Dish[]> {
  const { data } = await api.get("/dishes");
  const list = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return list.map((d: any) => mapDish(d));
}

export async function createDishApi(payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prep_time_min: payload.prepTime,
    description: payload.description,
    category_id: Number(payload.categoryId) || undefined,
    is_active: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
  };
  const { data } = await api.post("/dishes", backendPayload);
  return data.data as unknown as Dish;
}

export async function updateDishApi(id: string, payload: Partial<Dish>): Promise<Dish> {
  const backendPayload = {
    name: payload.name,
    price: payload.price,
    prep_time_min: payload.prepTime,
    description: payload.description,
    category_id: Number(payload.categoryId) || undefined,
    is_active: payload.isAvailable,
    images: payload.imageUrl ? [payload.imageUrl] : undefined,
  };
  const { data } = await api.put(`/dishes/${id}`, backendPayload);
  return data.data as unknown as Dish;
}

export async function deleteDishApi(id: string): Promise<void> {
  await api.delete(`/dishes/${id}`);
}

export async function toggleDishAvailabilityApi(id: string, status: boolean): Promise<void> {
  await api.patch(`/dishes/${id}/availability`, { isAvailable: status });
}

export async function getAdminMenusApi(): Promise<{ id: string; name: string; isActive: boolean }[]> {
  const { data } = await api.get("/menus");
  const items = Array.isArray(data.data) ? data.data : data.data?.items ?? [];
  return items.map((m: any) => ({
    id: String(m.id),
    name: m.name,
    isActive: Boolean(m.isActive ?? true),
  }));
}

export async function toggleMenuAvailabilityApi(id: string, status: boolean): Promise<void> {
  await api.patch(`/menus/${id}/availability`, { isActive: status });
}

export async function createCategoryApi(menuId: string, name: string): Promise<Category> {
  const { data } = await api.post(`/menus/${menuId}/categories`, {
    name,
    description: "",
    sortOrder: 0,
  });
  const c = data.data;
  return {
    id: String(c.id),
    name: c.name,
    emoji: c.icon || "tag",
  };
}


// ─── ADMIN: Full Sync for PWA (Stabilization) ───────────────────────────────

export async function getFullAdminMenuApi(): Promise<{
  menus: PublicMenu[];
  restaurant: { id: number; name: string; logoUrl?: string; isOpen: boolean };
}> {
  // 1. Fetch Admin Categories & Dishes
  const { data: dishesRes } = await api.get("/dishes");
  const rawDishes = Array.isArray(dishesRes.data) ? dishesRes.data : (dishesRes.data?.items ?? []);
  
  const { data: catRes } = await api.get("/menus"); // Using default menu or first available
  const rawMenus = Array.isArray(catRes.data) ? catRes.data : (catRes.data?.items ?? []);
  
  // 2. Fetch all categories across all menus
  const allCategories: Record<string, any> = {};
  for (const m of rawMenus) {
    try {
      const { data: cRes } = await api.get(`/menus/${m.id}/categories`);
      const cats = Array.isArray(cRes.data) ? cRes.data : (cRes.data?.items ?? []);
      cats.forEach((c: any) => {
        allCategories[String(c.id)] = {
          id: String(c.id),
          name: c.name,
          emoji: c.icon || "tag",
          dishes: []
        };
      });
    } catch (e) { console.error(`Failed to fetch categories for menu ${m.id}`, e); }
  }

  // 3. Populate categories with dishes
  rawDishes.forEach((d: any) => {
    const dish = mapDish(d);
    if (allCategories[dish.categoryId]) {
      allCategories[dish.categoryId].dishes.push(dish);
    } else {
      // Fallback: Create a "General" category if not found
      if (!allCategories["general"]) {
        allCategories["general"] = { id: "general", name: "General", emoji: "package", dishes: [] };
      }
      allCategories["general"].dishes.push(dish);
    }
  });

  // 4. Wrap into a pseudo PublicMenu
  const adminMenu: PublicMenu = {
    id: "admin-sync",
    name: "Administrador (Full Sync)",
    isActiveNow: true,
    isOrderableNow: true,
    categories: Object.values(allCategories).filter(c => c.dishes.length > 0)
  };

  return {
    menus: [adminMenu],
    restaurant: {
      id: 2,
      name: "Foodify Admin",
      isOpen: true
    }
  };
}
