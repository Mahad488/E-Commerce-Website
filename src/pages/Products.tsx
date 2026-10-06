import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";

function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [mobileFilter, setMobileFilter] = useState(false);

  const categories = [
    "All",
    "Fashion",
    "Electronics",
    "Accessories",
    "Lifestyle",
  ];

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(
          `${API_BASE_URL}/api/products`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch products"
          );
        }

        setProducts(data.products || []);
      } catch (error) {
        console.error("Products API error:", error);

        setApiError(
          "Unable to load products. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "low-high") {
      result.sort((a, b) => a.price - b.price);
    }

    if (sort === "high-low") {
      result.sort((a, b) => b.price - a.price);
    }

    if (sort === "name") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }

    return result;
  }, [products, search, category, sort]);

  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      {/* Page Header */}
      <section className="bg-[#f5f2ed] py-14">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <p className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
            Our Collection
          </p>

          <h1 className="text-4xl md:text-5xl font-black mt-3">
            All Products
          </h1>

          <p className="text-gray-600 mt-3">
            Discover products made for your lifestyle.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-5 lg:px-8 py-12">

        {/* Search and Sorting */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-8">

          <div className="flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-3 w-full md:max-w-md">
            <Search
              size={19}
              className="text-gray-500"
            />

            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="bg-transparent outline-none w-full text-sm"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                setMobileFilter(!mobileFilter)
              }
              className="md:hidden border rounded-xl px-4 py-3 flex items-center gap-2"
            >
              <SlidersHorizontal size={17} />
              Filters
            </button>

            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value)
              }
              className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none bg-white"
            >
              <option value="default">
                Sort By: Default
              </option>

              <option value="low-high">
                Price: Low to High
              </option>

              <option value="high-low">
                Price: High to Low
              </option>

              <option value="name">
                Name: A to Z
              </option>
            </select>

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">

          {/* Sidebar */}
          <aside
            className={`${
              mobileFilter ? "block" : "hidden"
            } md:block`}
          >
            <div className="border border-gray-100 rounded-2xl p-5 sticky top-28">

              <h3 className="font-bold text-lg mb-5">
                Categories
              </h3>

              <div className="space-y-4">

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

              <div className="border-t border-gray-100 mt-7 pt-6">

                <h3 className="font-bold mb-3">
                  Price Range
                </h3>

                <p className="text-sm text-gray-500">
                  Use sorting to arrange products by price.
                </p>

                <button
                  onClick={() =>
                    setSort("low-high")
                  }
                  className="mt-4 text-sm text-orange-500 font-semibold"
                >
                  Lowest Price First →
                </button>

              </div>

              <button
                onClick={() => {
                  setCategory("All");
                  setSearch("");
                  setSort("default");
                }}
                className="mt-7 w-full border rounded-xl py-3 text-sm hover:bg-gray-100"
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

            {/* Loading */}
            {loading && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />

                <p className="mt-4 text-gray-500">
                  Loading products...
                </p>
              </div>
            )}

            {/* API Error */}
            {!loading && apiError && (
              <div className="text-center py-20 bg-red-50 rounded-2xl">

                <h3 className="text-xl font-bold text-red-700">
                  Something went wrong
                </h3>

                <p className="text-red-600 mt-2">
                  {apiError}
                </p>

                <button
                  onClick={() =>
                    window.location.reload()
                  }
                  className="mt-5 bg-black text-white px-6 py-3 rounded-full"
                >
                  Try Again
                </button>

              </div>
            )}

            {/* Products */}
            {!loading &&
              !apiError &&
              filteredProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}

                </div>
              )}

            {/* No Products */}
            {!loading &&
              !apiError &&
              filteredProducts.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">

                  <h3 className="text-xl font-bold">
                    No Products Found
                  </h3>

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