import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

import ProductCard from "./ProductCard";
import type { Product } from "../data/products";
import { fetchCatalog } from "../lib/catalog";

const TABS = [
  { id: "new", label: "New Arrivals", link: "/products" },
  { id: "best", label: "Best Sellers", link: "/products?sort=popular" },
  { id: "top", label: "Top Rated", link: "/products?sort=rating" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("new");

  useEffect(() => {
    let active = true;
    fetchCatalog().then(({ products: list }) => {
      if (!active) return;
      setProducts(list);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const shown = useMemo(() => {
    const list = [...products];
    if (tab === "best") list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0) || b.rating - a.rating);
    if (tab === "top") list.sort((a, b) => b.rating - a.rating || (b.reviewCount || 0) - (a.reviewCount || 0));
    return list.slice(0, 8);
  }, [products, tab]);

  const activeTab = TABS.find((t) => t.id === tab)!;

  return (
    <section id="products" className="py-20 lg:py-28 bg-[#faf9f6] scroll-reveal">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={13} className="text-orange-500" />
              Handpicked Essentials
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Featured Products</h2>
            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg">
              Fresh drops, crowd favourites and the pieces our customers rate highest.
            </p>
          </div>

          <div role="tablist" aria-label="Featured product lists" className="flex bg-white border border-gray-200 rounded-full p-1 w-fit shadow-xs">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition ${
                  tab === t.id ? "bg-gray-950 text-white shadow" : "text-gray-600 hover:text-gray-950"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm overflow-hidden">
                <div className="aspect-square rounded-2xl bg-gray-200/70 shimmer-effect mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer-effect" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 shimmer-effect" />
                <div className="h-6 bg-gray-200 rounded w-1/2 shimmer-effect" />
              </div>
            ))}
          </div>
        ) : (
          <div key={tab} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 animate-fade-in">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            to={activeTab.link}
            className="group inline-flex items-center gap-2 border-2 border-gray-900 rounded-full px-8 py-3.5 text-sm font-bold hover:bg-gray-900 hover:text-white transition"
          >
            View all {activeTab.label.toLowerCase()}
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
