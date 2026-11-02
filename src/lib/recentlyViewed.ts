import type { Product } from "../data/products";

const KEY = "nova_recently_viewed";
const LIMIT = 8;

export function getRecentlyViewed(): Product[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.id === "number") : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product: Product) {
  try {
    const next = [product, ...getRecentlyViewed().filter((p) => p.id !== product.id)].slice(0, LIMIT);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — nothing to remember
  }
}
