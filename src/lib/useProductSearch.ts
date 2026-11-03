import { useEffect, useState } from "react";

import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

/** Debounced live search against /api/products?search= (first 5 matches). */
export function useProductSearch() {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);

  const setQuery = (value: string) => {
    setQueryState(value);
    if (!value.trim()) {
      setResults([]);
      setSearched(false);
    }
  };

  useEffect(() => {
    const term = query.trim();
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products?search=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data: { products?: Product[] } = await res.json();
        if (res.ok && Array.isArray(data.products)) {
          setResults(data.products.slice(0, 5));
          setSearched(true);
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) console.error("Search autocomplete error:", err);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { query, setQuery, results, searched };
}
