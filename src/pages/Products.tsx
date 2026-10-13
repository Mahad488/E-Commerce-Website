import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Flame } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

import { API_BASE_URL } from "../config/api";
import { products as fallbackCatalog, type Product } from "../data/products";

function Products() {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlSale = searchParams.get("sale") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [saleOnly, setSaleOnly] = useState(urlSale);
  const [mobileFilter, setMobileFilter] = useState(false);

  const categories = [
    "All",
    "Fashion",
    "Electronics",
    "Accessories",
    "Lifestyle",
    "Footwear",
    "Gaming & Tech",
  ];

  useEffect(() => {
    if (urlCategory) {
      setCategory(urlCategory);
    }
    if (searchParams.get("sale") === "true") {
      setSaleOnly(true);
    }
  }, [urlCategory, searchParams]);

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(`${API_BASE_URL}/api/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch products");
        }

        // Format numeric values from backend string fields (e.g. MySQL DECIMAL)
        const formattedProducts = (data.products || []).map(
          (product: Product) => ({
            ...product,
            id: Number(product.id),
            price: Number(product.price) || 0,
            oldPrice: Number(product.oldPrice) || 0,
            rating: Number(product.rating) || 0,
            stock: Number(product.stock) || 0,
          })
        );

        setProducts(formattedProducts);
      } catch (error) {
        console.warn("Backend API unavailable, using local product catalog:", error);
        setProducts(fallbackCatalog);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const saleProductsCount = useMemo(() => {
    return products.filter((p) => (Number(p.oldPrice) || 0) > (Number(p.price) || 0)).length;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const priceNum = Number(product.price) || 0;
      const oldPriceNum = Number(product.oldPrice) || 0;
      const isOnSale = oldPriceNum > priceNum && priceNum > 0;

      if (saleOnly && !isOnSale) {
        return false;
      }

      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category ||
        (category === "Gaming & Tech" && product.category === "Electronics") ||
        (category === "Footwear" && product.category === "Fashion");

      return matchesSearch && matchesCategory;
    });

    if (sort === "low-high") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    }

    if (sort === "high-low") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (sort === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, search, category, sort, saleOnly]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Page Header */}
      <section className="bg-[#f5f2ed] py-14">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {saleOnly ? (
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Flame size={13} className="fill-rose-600 text-rose-600" />
              Limited Time Deals & Sales
            </div>
          ) : (
            <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
              Our Collection
            </p>
          )}

          <h1 className="text-4xl md:text-5xl font-black mt-3">
            {saleOnly ? "Flash Sale & Special Deals" : "All Products"}
          </h1>

          <p className="text-gray-600 mt-3">
            {saleOnly
              ? "Discover handpicked premium items on sale at exclusive discounted rates."
              : "Discover products made for your lifestyle."}
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {/* Search and Sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">
          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3 w-full md:max-w-md">
            <Search size={19} className="text-gray-500" />

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none w-full text-sm"
            />

            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setMobileFilter(!mobileFilter)}
              className="md:hidden border rounded-xl px-4 py-3 flex items-center gap-2"
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-white"
            >
              <option value="default">Sort By: Default</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
          {/* Sidebar */}
          <aside className={`${mobileFilter ? "block" : "hidden"} md:block`}>
            <div className="border border-gray-100 rounded-2xl p-5 sticky top-28 space-y-6">
              {/* On Sale Deals Toggle Button */}
              <button
                onClick={() => {
                  setSaleOnly(!saleOnly);
                  setMobileFilter(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  saleOnly
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-rose-50 text-rose-800 hover:bg-rose-100/80 border border-rose-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flame
                    size={15}
                    className={
                      saleOnly ? "fill-white text-white" : "fill-rose-500 text-rose-500"
                    }
                  />
                  On Sale Deals Only
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    saleOnly ? "bg-white/20 text-white" : "bg-rose-200 text-rose-900"
                  }`}
                >
                  {saleProductsCount}
                </span>
              </button>

              <div>
                <h3 className="font-bold text-lg mb-4">Categories</h3>

                <div className="space-y-3">
                  {categories.map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        setCategory(item);
                        setMobileFilter(false);
                      }}
                      className={`block w-full text-left text-sm transition ${
                        category === item
                          ? "text-orange-500 font-bold"
                          : "text-gray-600 hover:text-orange-500"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-bold mb-3">Price Range</h3>

                <p className="text-sm text-gray-500">
                  Use sorting to arrange products by price.
                </p>

                <button
                  onClick={() => setSort("low-high")}
                  className="mt-3 text-sm text-orange-500 font-semibold"
                >
                  Lowest Price First →
                </button>
              </div>

              <button
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                  setSort("default");
                  setSaleOnly(false);
                }}
                className="w-full border rounded-xl py-3 text-sm hover:bg-gray-100 transition"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Product Grid */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-500">
                Showing {filteredProducts.length} products
              </p>

              {category !== "All" && (
                <span className="text-sm text-orange-500 font-medium">
                  {category}
                </span>
              )}
            </div>

            {/* Loading Skeleton */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs overflow-hidden"
                  >
                    <div className="aspect-square rounded-2xl bg-gray-200/80 shimmer-effect mb-4" />
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2 shimmer-effect" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3 shimmer-effect" />
                    <div className="h-6 bg-gray-200 rounded w-1/2 shimmer-effect" />
                  </div>
                ))}
              </div>
            )}

            {/* API Error */}
            {!loading && apiError && (
              <div className="text-center py-20 bg-red-50 rounded-2xl">
                <h3 className="text-xl font-bold text-red-700">
                  Something went wrong
                </h3>
                <p className="text-red-600 mt-2">{apiError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-5 bg-black text-white px-6 py-3 rounded-full"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Products */}
            {!loading && !apiError && filteredProducts.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* No Products */}
            {!loading && !apiError && filteredProducts.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl">
                <h3 className="text-xl font-bold">No Products Found</h3>
                <p className="text-gray-500 mt-2">
                  Try another search or category.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-5 bg-black text-white px-6 py-3 rounded-full"
                >
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