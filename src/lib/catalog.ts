import { API_BASE_URL } from "../config/api";
import { products as fallbackCatalog, type Product } from "../data/products";

export const STORE_CATEGORIES = [
  "Fashion",
  "Footwear",
  "Accessories",
  "Electronics",
  "Lifestyle",
  "Gaming & Tech",
] as const;

const CATEGORY_FALLBACKS: Record<string, string> = {
  Fashion: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  Footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  Electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  Accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  "Gaming & Tech": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
};

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

export function getFallbackImage(category?: string): string {
  return (category && CATEGORY_FALLBACKS[category]) || DEFAULT_FALLBACK;
}

export function getImageUrl(imagePath?: string | null, category?: string): string {
  if (!imagePath || imagePath.includes("via.placeholder.com")) {
    return getFallbackImage(category);
  }
  if (imagePath.startsWith("https://images.unsplash.com/photo-") && !imagePath.includes("?")) {
    return `${imagePath}?auto=format&fit=crop&w=600&q=80`;
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://") || imagePath.startsWith("data:")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

/** onError handler that swaps a broken image for its category fallback once. */
export function imageFallbackHandler(category?: string) {
  return (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.currentTarget;
    const fallback = getFallbackImage(category);
    if (target.src !== fallback) target.src = fallback;
  };
}

type RawProduct = Partial<Omit<Product, "price" | "oldPrice" | "rating" | "stock" | "id">> & {
  id: number | string;
  price: number | string;
  oldPrice?: number | string | null;
  rating?: number | string | null;
  stock?: number | string | null;
};

/** MySQL DECIMAL columns arrive as strings — normalise everything to numbers. */
export function normalizeProduct(raw: RawProduct): Product {
  return {
    ...(raw as Product),
    id: Number(raw.id),
    name: raw.name || "Untitled product",
    category: raw.category || "Lifestyle",
    description: raw.description || "",
    image: raw.image || "",
    price: Number(raw.price) || 0,
    oldPrice: Number(raw.oldPrice) || 0,
    rating: Number(raw.rating) || 0,
    stock: Number(raw.stock) || 0,
    colors: Array.isArray(raw.colors) ? raw.colors : [],
    reviewCount: Number(raw.reviewCount) || 0,
    soldCount: Number(raw.soldCount) || 0,
  };
}

export function isOnSale(product: Product): boolean {
  return product.oldPrice > product.price && product.price > 0;
}

export function discountPercent(product: Product): number {
  return isOnSale(product) ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
}

export interface CatalogResult {
  products: Product[];
  offline: boolean;
}

/**
 * Loads the catalogue from the API, falling back to the bundled demo
 * catalogue when the backend isn't running so the storefront still works.
 */
const CACHE_MS = 30_000;
let cached: { at: number; promise: Promise<CatalogResult> } | null = null;

export function fetchCatalog(query = ""): Promise<CatalogResult> {
  // Several homepage sections need the full catalogue — share one request.
  if (!query) {
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.promise;
    const promise = loadCatalog("");
    cached = { at: Date.now(), promise };
    return promise;
  }
  return loadCatalog(query);
}

async function loadCatalog(query: string): Promise<CatalogResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products${query ? `?${query}` : ""}`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.products)) throw new Error(data.message || "Bad response");
    return { products: data.products.map(normalizeProduct), offline: false };
  } catch (error) {
    console.warn("Backend unavailable, using the bundled catalogue:", error);
    return { products: fallbackCatalog.map(normalizeProduct), offline: true };
  }
}

export async function fetchProduct(id: number | string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
    const data = await response.json();
    if (response.status === 404) return null;
    if (!response.ok || !data.product) throw new Error(data.message || "Bad response");
    return normalizeProduct(data.product);
  } catch {
    const local = fallbackCatalog.find((p) => p.id === Number(id));
    return local ? normalizeProduct(local) : null;
  }
}

export async function fetchRelated(product: Product): Promise<Product[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${product.id}/related`);
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.products)) throw new Error();
    return data.products.map(normalizeProduct);
  } catch {
    return fallbackCatalog
      .filter((p) => p.id !== product.id)
      .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
      .slice(0, 4)
      .map(normalizeProduct);
  }
}
