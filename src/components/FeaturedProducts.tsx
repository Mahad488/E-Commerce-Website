import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";

import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products`);
        const data = await response.json();

        if (response.ok && Array.isArray(data.products)) {
          const formatted = data.products.slice(0, 4).map((product: any) => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price) || 0,
            oldPrice: Number(product.oldPrice) || 0,
            rating: Number(product.rating) || 0,
            stock: Number(product.stock) || 0,
          }));
          setProducts(formatted);
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <section id="products" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">
          <div>
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
              Our Collection
            </span>

            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Featured Products
            </h2>

            <p className="text-gray-500 mt-2">
              Handpicked products just for you from our live catalog.
            </p>
          </div>

          <Link
            to="/products"
            className="text-sm font-semibold text-orange-500 hover:underline"
          >
            View All Products →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
            <p className="mt-3 text-sm text-gray-500">Loading featured products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;