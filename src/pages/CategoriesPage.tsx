import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Shirt,
  Smartphone,
  Watch,
  ShoppingBag,
  Footprints,
  Gamepad2,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

const CATEGORY_LIST = [
  {
    name: "Fashion",
    icon: Shirt,
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    badge: "Popular",
    badgeBg: "bg-pink-500",
    description: "Discover stylish casual jackets, t-shirts, sneakers, and modern clothing.",
    itemCount: "20+ Products",
  },
  {
    name: "Electronics",
    icon: Smartphone,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    badge: "Best Seller",
    badgeBg: "bg-blue-500",
    description: "High-fidelity headphones, smartwatches, keyboards & wireless devices.",
    itemCount: "15+ Products",
  },
  {
    name: "Accessories",
    icon: Watch,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    badge: "Trending",
    badgeBg: "bg-amber-500",
    description: "Minimal wristwatches, classic sunglasses, and genuine leather items.",
    itemCount: "18+ Products",
  },
  {
    name: "Lifestyle",
    icon: ShoppingBag,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    badge: "New",
    badgeBg: "bg-emerald-500",
    description: "Premium backpacks, travel accessories, mugs, and daily essentials.",
    itemCount: "12+ Products",
  },
  {
    name: "Footwear",
    icon: Footprints,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    badge: "Hot Deals",
    badgeBg: "bg-purple-500",
    description: "Lightweight running sneakers, casual shoes, and active footwear.",
    itemCount: "10+ Products",
  },
  {
    name: "Gaming & Tech",
    icon: Gamepad2,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    badge: "Featured",
    badgeBg: "bg-indigo-500",
    description: "RGB mechanical keyboards, fitness bands, and high-performance gear.",
    itemCount: "8+ Products",
  },
];

function CategoriesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/products`);
        const data = await res.json();

        if (res.ok && Array.isArray(data.products)) {
          const formatted = data.products.map((p: any) => ({
            ...p,
            id: Number(p.id),
            price: Number(p.price) || 0,
            oldPrice: Number(p.oldPrice) || 0,
            rating: Number(p.rating) || 0,
            stock: Number(p.stock) || 0,
          }));
          setProducts(formatted);
        }
      } catch (err) {
        console.error("Failed to load products for categories page:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-[#f5f2ed] py-16 border-b">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <Layers size={15} />
            Category Catalog
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
            Explore All Categories
          </h1>

          <p className="text-gray-600 mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Browse our complete range of product categories crafted to elevate your daily lifestyle.
          </p>
        </div>
      </section>

      {/* Main Categories Section */}
      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CATEGORY_LIST.map((cat) => {
            const Icon = cat.icon;

            return (
              <div
                key={cat.name}
                className="group bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition duration-300 flex flex-col justify-between"
              >
                {/* Image Banner */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  <span
                    className={`absolute top-4 right-4 ${cat.badgeBg} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow`}
                  >
                    {cat.badge}
                  </span>

                  <div className="absolute bottom-4 left-4 right-4 text-white flex items-center gap-3">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{cat.name}</h3>
                      <p className="text-xs text-gray-200">{cat.itemCount}</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Link
                      to={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-black text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-orange-500 transition shadow"
                    >
                      Browse {cat.name} Products
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Category Showcase */}
        {!loading && products.length > 0 && (
          <section className="mt-20 pt-16 border-t">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10">
              <div>
                <span className="text-orange-500 text-xs font-bold uppercase tracking-widest">
                  Live Catalog Preview
                </span>
                <h2 className="text-3xl font-black text-gray-900 mt-2">
                  Featured Category Items
                </h2>
              </div>
              <Link
                to="/products"
                className="text-sm font-bold text-orange-500 hover:underline mt-3 md:mt-0"
              >
                View Full Product Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Promotional Banner */}
        <section className="mt-20 bg-gradient-to-r from-orange-600 to-amber-500 rounded-3xl p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles size={14} />
              Exclusive Category Deals
            </div>
            <h2 className="text-3xl md:text-4xl font-black">
              Unbeatable Prices On Top Categories
            </h2>
            <p className="text-orange-100 mt-3 text-sm md:text-base">
              Shop our latest collection across Fashion, Electronics, and Accessories with fast express delivery.
            </p>
          </div>

          <Link
            to="/products"
            className="bg-white text-black px-8 py-4 rounded-full font-bold text-base hover:bg-black hover:text-white transition shadow-lg shrink-0"
          >
            Explore All Deals
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default CategoriesPage;
