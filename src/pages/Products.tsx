import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Flame, Star, PackageCheck, WifiOff } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

import type { Product } from "../data/products";
import { STORE_CATEGORIES, discountPercent, fetchCatalog, isOnSale } from "../lib/catalog";
import { useCurrency } from "../context/CurrencyContext";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Best selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top rated" },
  { value: "discount", label: "Biggest discount" },
  { value: "name", label: "Name: A to Z" },
];

const RATING_OPTIONS = [4, 3, 2];

function sortProducts(list: Product[], sort: string) {
  const sorted = [...list];
  switch (sort) {
    case "price-asc":
    case "low-high":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
    case "high-low":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating || (b.reviewCount || 0) - (a.reviewCount || 0));
    case "popular":
      return sorted.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || b.rating - a.rating);
    case "discount":
      return sorted.sort((a, b) => discountPercent(b) - discountPercent(a));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted; // API already returns newest first
  }
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  // All filter state lives in the URL, so filtered views can be shared and the back button works.
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All";
  const sort = searchParams.get("sort") || "newest";
  const saleOnly = searchParams.get("sale") === "true";
  const inStockOnly = searchParams.get("stock") === "in";
  const minRating = Number(searchParams.get("rating")) || 0;
  const minPrice = searchParams.get("min") ?? "";
  const maxPrice = searchParams.get("max") ?? "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [mobileFilter, setMobileFilter] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [searchInput, setSearchInput] = useState(search);
  const [lastUrlSearch, setLastUrlSearch] = useState(search);

  // Keep the box in sync when the URL changes from elsewhere (e.g. the navbar search).
  if (search !== lastUrlSearch) {
    setLastUrlSearch(search);
    setSearchInput(search);
  }

  const updateParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "" || (key === "category" && value === "All")) next.delete(key);
      else next.set(key, value);
    }
    setSearchParams(next, { replace: true });
    setVisible(PAGE_SIZE);
  };

  useEffect(() => {
    let active = true;
    fetchCatalog().then(({ products: list, offline: isOffline }) => {
      if (!active) return;
      setProducts(list);
      setOffline(isOffline);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  // Debounce typing into the URL.
  useEffect(() => {
    if (searchInput === search) return;
    const timer = setTimeout(() => updateParams({ search: searchInput.trim() || null }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const categories = useMemo(() => {
    const names = new Set<string>(STORE_CATEGORIES);
    products.forEach((p) => names.add(p.category));
    return ["All", ...names];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: products.length };
    products.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
    return counts;
  }, [products]);

  const priceCeiling = useMemo(() => Math.ceil(Math.max(0, ...products.map((p) => p.price))), [products]);
  const saleCount = useMemo(() => products.filter(isOnSale).length, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minPrice === "" ? 0 : Number(minPrice);
    const max = maxPrice === "" ? Infinity : Number(maxPrice);

    const result = products.filter((p) => {
      if (saleOnly && !isOnSale(p)) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (minRating && p.rating < minRating) return false;
      if (p.price < min || p.price > max) return false;
      if (category !== "All" && p.category !== category) return false;
      if (term && !`${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
    return sortProducts(result, sort);
  }, [products, search, category, sort, saleOnly, inStockOnly, minRating, minPrice, maxPrice]);

  type Chip = { label: string; clear: Record<string, null> };
  const activeChips: Chip[] = [];
  if (category !== "All") activeChips.push({ label: category, clear: { category: null } });
  if (search) activeChips.push({ label: `"${search}"`, clear: { search: null } });
  if (saleOnly) activeChips.push({ label: "On sale", clear: { sale: null } });
  if (inStockOnly) activeChips.push({ label: "In stock", clear: { stock: null } });
  if (minRating > 0) activeChips.push({ label: `${minRating}★ & up`, clear: { rating: null } });
  if (minPrice || maxPrice) {
    activeChips.push({
      label: `${formatPrice(Number(minPrice) || 0)} – ${maxPrice ? formatPrice(Number(maxPrice)) : "any"}`,
      clear: { min: null, max: null },
    });
  }

  const resetAll = () => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), { replace: true });
    setVisible(PAGE_SIZE);
  };

  const pricePresets = [
    { label: "Under $50", min: "", max: "50" },
    { label: "$50 – $100", min: "50", max: "100" },
    { label: "$100+", min: "100", max: "" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#f5f2ed] py-14">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {saleOnly ? (
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Flame size={13} className="fill-rose-600 text-rose-600" />
              Limited Time Deals & Sales
            </div>
          ) : (
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest">Our Collection</p>
          )}
          <h1 className="text-4xl md:text-5xl font-black mt-3">
            {saleOnly ? "Flash Sale & Special Deals" : category !== "All" ? category : "All Products"}
          </h1>
          <p className="text-gray-600 mt-3">
            {saleOnly
              ? "Handpicked items at their lowest prices of the season."
              : "Discover products made for your lifestyle."}
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {offline && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <WifiOff size={18} className="shrink-0 mt-0.5" />
            <span>
              Showing the offline demo catalogue because the API isn't reachable. Start the backend to see live stock and
              place orders.
            </span>
          </div>
        )}

        {/* Search and sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3 w-full md:max-w-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:bg-white transition">
            <Search size={19} className="text-gray-500" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
              aria-label="Search products"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput("");
                  updateParams({ search: null });
                }}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMobileFilter(!mobileFilter)}
              className="md:hidden border rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold"
            >
              <SlidersHorizontal size={17} />
              Filters{activeChips.length ? ` (${activeChips.length})` : ""}
            </button>

            <select
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value === "newest" ? null : e.target.value })}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-white"
              aria-label="Sort products"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  if ("search" in chip.clear) setSearchInput("");
                  updateParams(chip.clear);
                }}
                className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-800 border border-orange-200 rounded-full pl-3 pr-2 py-1 text-xs font-bold hover:bg-orange-100"
              >
                {chip.label}
                <X size={13} />
              </button>
            ))}
            <button onClick={resetAll} className="text-xs font-semibold text-gray-500 hover:text-gray-900 underline ml-1">
              Clear all
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
          {/* Filters */}
          <aside className={`${mobileFilter ? "block" : "hidden"} md:block`}>
            <div className="border border-gray-100 rounded-2xl p-5 md:sticky md:top-28 space-y-6">
              <button
                onClick={() => updateParams({ sale: saleOnly ? null : "true" })}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  saleOnly
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flame size={15} className={saleOnly ? "fill-white text-white" : "fill-rose-500 text-rose-500"} />
                  On Sale Only
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    saleOnly ? "bg-white/20 text-white" : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {saleCount}
                </span>
              </button>

              <div>
                <h3 className="font-bold mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        updateParams({ category: item });
                        setMobileFilter(false);
                      }}
                      className={`w-full flex items-center justify-between text-left text-sm px-2.5 py-1.5 rounded-lg transition ${
                        category === item ? "bg-orange-50 text-orange-600 font-bold" : "text-gray-600 hover:text-orange-500"
                      }`}
                    >
                      <span>{item}</span>
                      <span className="text-[11px] text-gray-400 font-semibold">{categoryCounts[item] || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-bold mb-3">Price (USD)</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateParams({ min: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                    aria-label="Minimum price"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="decimal"
                    placeholder={priceCeiling ? String(priceCeiling) : "Max"}
                    value={maxPrice}
                    onChange={(e) => updateParams({ max: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
                    aria-label="Maximum price"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pricePresets.map((preset) => {
                    const active = minPrice === preset.min && maxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        onClick={() =>
                          updateParams(active ? { min: null, max: null } : { min: preset.min, max: preset.max })
                        }
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition ${
                          active ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-bold mb-3">Customer rating</h3>
                <div className="space-y-1">
                  {RATING_OPTIONS.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateParams({ rating: minRating === rating ? null : String(rating) })}
                      className={`w-full flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg transition ${
                        minRating === rating ? "bg-amber-50 text-amber-800 font-bold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            className={s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                          />
                        ))}
                      </span>
                      & up
                    </button>
                  ))}
                </div>
              </div>

              <label className="border-t border-gray-100 pt-5 flex items-center justify-between cursor-pointer">
                <span className="font-bold flex items-center gap-2">
                  <PackageCheck size={16} className="text-emerald-600" />
                  In stock only
                </span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => updateParams({ stock: e.target.checked ? "in" : null })}
                  className="w-4 h-4 accent-orange-500"
                />
              </label>

              <button onClick={resetAll} className="w-full border rounded-xl py-3 text-sm hover:bg-gray-100 transition">
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Grid */}
          <div>
            <p className="text-sm text-gray-500 mb-6">
              {loading ? "Loading products…" : `Showing ${Math.min(visible, filteredProducts.length)} of ${filteredProducts.length} products`}
            </p>

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs overflow-hidden">
                    <div className="aspect-square rounded-2xl bg-gray-200/80 shimmer-effect mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer-effect" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 shimmer-effect" />
                    <div className="h-6 bg-gray-200 rounded w-1/2 shimmer-effect" />
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredProducts.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.slice(0, visible).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {visible < filteredProducts.length && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="border-2 border-gray-900 rounded-full px-8 py-3 text-sm font-bold hover:bg-gray-900 hover:text-white transition"
                    >
                      Load more ({filteredProducts.length - visible} left)
                    </button>
                  </div>
                )}
              </>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl">
                <h3 className="text-xl font-bold">No products match those filters</h3>
                <p className="text-gray-500 mt-2">Try widening the price range or picking another category.</p>
                <button onClick={resetAll} className="mt-5 bg-black text-white px-6 py-3 rounded-full">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Products;
