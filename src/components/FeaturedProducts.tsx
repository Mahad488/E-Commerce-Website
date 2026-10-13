import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import ProductCard from "./ProductCard";

import { API_BASE_URL } from "../config/api";
import { products as fallbackCatalog, type Product } from "../data/products";

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const data = await response.json();

        if (response.ok && Array.isArray(data.products) && data.products.length > 0) {
          const formatted = data.products.slice(0, 4).map((product: any) => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price) || 0,
            oldPrice: Number(product.oldPrice) || 0,
            rating: Number(product.rating) || 0,
            stock: Number(product.stock) || 0,
          }));
          setProducts(formatted);
        } else {
          setProducts(fallbackCatalog.slice(0, 4));
        }
      } catch (error) {
        console.warn("Using offline fallback catalog:", error);
        setProducts(fallbackCatalog.slice(0, 4));
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <section id="products" className="py-20 lg:py-28 bg-[#faf9f6] scroll-reveal">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={13} className="text-orange-500" />
              Handpicked Essentials
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
              Featured Products
            </h2>

            <p className="text-gray-500 mt-2 text-sm sm:text-base max-w-lg">
              Explore our best-rated items crafted with premium materials and signature design.
            </p>
          </div>

          <Link
            to="/products"
            className="group inline-flex items-center gap-2 text-sm font-bold text-orange-600 hover:text-orange-700 transition"
          >
            <span>View Complete Catalog</span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </Link>
        </div>

        {/* Product Grid or Skeleton Loaders */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="aspect-square rounded-2xl bg-gray-200/70 shimmer-effect mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer-effect" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 shimmer-effect" />
                <div className="h-6 bg-gray-200 rounded w-1/2 shimmer-effect" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
}