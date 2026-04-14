export interface Category {
  id: string;
  name: string;
  emoji: string;
  dishes?: Dish[]; // Optional dishes within the category
}

export interface PublicMenu {
  id: string;
  name: string;
  isActiveNow: boolean;
  isOrderableNow: boolean;
  availabilityNote?: string;
  categories: Category[];
}

export interface Dish {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  emoji?: string;
  isAvailable: boolean;
  available?: boolean;
  soldCount?: number;
  badge?: "Popular" | "Nuevo" | "Chef";
  prepTime?: number;
  allergens?: string[];
  availabilityNote?: string;
}

export interface CartItem {
  dish: Dish;
  qty: number;
  specialNotes?: string;
}