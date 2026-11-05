/* eslint-disable react-refresh/only-export-components */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  Check,
  Copy,
  DollarSign,
  Download,
  Eye,
  Filter,
  Layers,
  Package,
  Palette,
  RefreshCw,
  Search,
  Tag,
  X,
} from "lucide-react";
import { API_BASE_URL } from "../../src/config/api";
import type { Product } from "../../src/data/products";
import { getImageUrl, normalizeProduct } from "../../src/lib/catalog";
import { useMediaQuery } from "../../src/lib/useMediaQuery";
import type { Order } from "./orderTypes";

// ==========================================
// 2. PRESET COLORS & CATEGORIES
// ==========================================

export const ADMIN_PRESET_COLORS = [
  { name: "Black", hex: "#111827" },
  { name: "White", hex: "#ffffff" },
  { name: "Red", hex: "#dc2626" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Green", hex: "#16a34a" },
  { name: "Grey", hex: "#6b7280" },
  { name: "Brown", hex: "#78350f" },
  { name: "Beige", hex: "#d6c7b2" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Purple", hex: "#9333ea" },
];

export const ADMIN_BASE_CATEGORIES = [
  "Fashion",
  "Electronics",
  "Accessories",
  "Lifestyle",
  "Footwear",
  "Gaming & Tech",
];

// ==========================================
// 3. LIVE DATA
// ==========================================

interface HubData {
  products?: Product[];
  orders?: Order[];
  error?: string;
  signedOut?: boolean;
}

async function fetchHubData(): Promise<HubData> {
  const headers = { Authorization: `Bearer ${localStorage.getItem("nova_admin_token")}` };
  try {
    const [productsRes, ordersRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/products`, { headers }),
      fetch(`${API_BASE_URL}/api/admin/orders`, { headers }),
    ]);
    if (ordersRes.status === 401 || ordersRes.status === 403) return { signedOut: true };
    const productsBody = await productsRes.json();
    const ordersBody = await ordersRes.json();
    if (!productsRes.ok || !ordersRes.ok || !Array.isArray(productsBody.products) || !Array.isArray(ordersBody.orders)) {
      return { error: ordersBody.message || productsBody.message || "Couldn't load the store data." };
    }
    return { products: productsBody.products.map(normalizeProduct), orders: ordersBody.orders };
  } catch {
    return { error: "Couldn't reach the server. Check your connection, then try again." };
  }
}

const STATUS_PILLS: Record<string, string> = {
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  shipped: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  processing: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap text-[11px] font-bold px-2 py-1 rounded-lg border ${
        STATUS_PILLS[status.toLowerCase()] || "bg-amber-500/10 text-amber-400 border-amber-500/30"
      }`}
    >
      {status}
    </span>
  );
}

// ==========================================
// 4. REACT COMPONENT: AdminPortalData
// ==========================================

export default function AdminPortalData() {
  const navigate = useNavigate();
  const wide = useMediaQuery("(min-width: 768px)");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "raw-data">("overview");

  // Filter States
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("All");
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  const applyData = (data: HubData) => {
    if (data.signedOut) {
      localStorage.removeItem("nova_admin_token");
      navigate("/admin-login", { replace: true });
      return;
    }
    if (data.error) {
      setLoadError(data.error);
    } else {
      setProducts(data.products ?? []);
      setOrders(data.orders ?? []);
      setLoadError("");
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    fetchHubData().then((data) => active && applyData(data));
    return () => {
      active = false;
    };
    // Loads once on open; the Refresh button loads again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => {
    setLoading(true);
    fetchHubData().then(applyData);
  };

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalRev = orders
      .filter((o) => o.status.toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const pendingOrders = orders.filter((o) => o.status.toLowerCase() === "pending").length;
    const deliveredOrders = orders.filter((o) => o.status.toLowerCase() === "delivered").length;
    const totalInventoryStock = products.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const lowStockCount = products.filter((p) => p.stock <= 12).length;

    return {
      totalProducts: products.length,
      totalOrders: orders.length,
      totalRevenue: totalRev,
      pendingOrders,
      deliveredOrders,
      totalInventoryStock,
      lowStockCount,
    };
  }, [products, orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderFilter !== "All" && o.status.toLowerCase() !== orderFilter.toLowerCase()) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesId = String(o.id).includes(q);
        const matchesName = (o.user_name || "").toLowerCase().includes(q);
        const matchesEmail = (o.user_email || "").toLowerCase().includes(q);
        const matchesCity = (o.city || "").toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesEmail && !matchesCity) return false;
      }
      return true;
    });
  }, [orders, orderFilter, orderSearch]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (productCategoryFilter !== "All" && p.category.toLowerCase() !== productCategoryFilter.toLowerCase()) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCat) return false;
      }
      return true;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Copy Full JSON
  const handleCopyJson = () => {
    const fullDataset = {
      brand: "Marhaba Tech",
      exported_at: new Date().toISOString(),
      metrics,
      preset_colors: ADMIN_PRESET_COLORS,
      categories: ADMIN_BASE_CATEGORIES,
      products,
      orders,
    };
    navigator.clipboard.writeText(JSON.stringify(fullDataset, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download JSON
  const handleDownloadJson = () => {
    const fullDataset = {
      brand: "Marhaba Tech",
      exported_at: new Date().toISOString(),
      metrics,
      preset_colors: ADMIN_PRESET_COLORS,
      categories: ADMIN_BASE_CATEGORIES,
      products,
      orders,
    };
    const blob = new Blob([JSON.stringify(fullDataset, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marhaba_tech_admin_data_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    // Below 1024px every field uses 16px text, otherwise iOS zooms the page when one is focused.
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10 font-sans max-lg:[&_input]:text-base max-lg:[&_select]:text-base">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-5 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 md:pb-6">
        <div>
          <Link
            to="/admin"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition mb-1"
          >
            <ArrowLeft size={16} aria-hidden />
            Back to dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Admin Portal Master Data
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Live products and orders from your store, ready to inspect or export.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={refresh}
            disabled={loading}
            className="col-span-2 flex min-h-11 items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "motion-safe:animate-spin" : ""} aria-hidden />
            {loading ? "Loading..." : "Refresh"}
          </button>
          <button
            onClick={handleCopyJson}
            className="flex min-h-11 items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? "Copied JSON!" : "Copy Raw JSON"}
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex min-h-11 items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
          >
            <Download size={14} />
            Export Data File
          </button>
        </div>
      </header>

      {loadError && (
        <div role="alert" className="max-w-7xl mx-auto mb-5 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <span>{loadError}</span>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-5 md:mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">Products</p>
            <h3 className="text-2xl font-black text-white mt-1">{metrics.totalProducts}</h3>
            <p className="text-xs text-slate-400 mt-1">{metrics.totalInventoryStock} total units in stock</p>
          </div>
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 items-center justify-center">
            <Box size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">Orders</p>
            <h3 className="text-2xl font-black text-white mt-1">{metrics.totalOrders}</h3>
            <p className="text-xs text-emerald-400 mt-1">{metrics.deliveredOrders} orders delivered</p>
          </div>
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 items-center justify-center">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">Revenue</p>
            <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 truncate">${metrics.totalRevenue.toFixed(2)}</h3>
            <p className="text-xs text-slate-400 mt-1">Excludes cancelled orders</p>
          </div>
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs uppercase font-bold tracking-wider text-slate-400">Pending</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingOrders}</h3>
            <p className="text-xs text-amber-400 mt-1">{metrics.lowStockCount} items low stock</p>
          </div>
          <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 sm:mx-auto sm:px-0">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTab === "overview" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Overview & Presets
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTab === "products" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Products Data ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTab === "orders" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Orders Data ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("raw-data")}
          className={`pb-3 px-3 sm:px-4 text-sm font-bold border-b-2 transition shrink-0 whitespace-nowrap ${
            activeTab === "raw-data" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Raw JSON Inspection
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & PRESETS */}
      {activeTab === "overview" && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Preset Colors */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-200 font-bold">
                <Palette size={18} className="text-emerald-400" />
                <h3>Color Palette Presets</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ADMIN_PRESET_COLORS.map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span
                      className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{c.hex}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Categories */}
            <div className="bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4 text-slate-200 font-bold">
                <Tag size={18} className="text-emerald-400" />
                <h3>Store Categories</h3>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ADMIN_BASE_CATEGORIES.map((cat) => {
                  const count = products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
                  return (
                    <div
                      key={cat}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-semibold text-slate-300"
                    >
                      <Layers size={13} className="text-emerald-400" />
                      <span>{cat}</span>
                      <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full text-[10px]">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PRODUCTS DATA */}
      {activeTab === "products" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-slate-400" />
              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Categories</option>
                {ADMIN_BASE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {filteredProducts.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">{loading ? "Loading products..." : "No products to show."}</p>
            ) : !wide ? (
              <ul className="divide-y divide-slate-800">
                {filteredProducts.map((p) => (
                  <li key={p.id} className="flex gap-3 p-3">
                    <img
                      src={getImageUrl(p.image, p.category)}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 shrink-0 rounded-xl border border-slate-700 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-bold text-white">{p.name}</p>
                      <p className="truncate text-xs text-slate-400">
                        #{p.id} · {p.category}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <span className="font-bold text-emerald-400">${p.price}</span>
                        <span className="text-slate-300">{p.stock} in stock</span>
                        {p.rating > 0 && <span className="font-semibold text-amber-400">★ {p.rating}</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Colors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-500">#{p.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(p.image, p.category)}
                            alt={p.name}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-400">${p.price}</span>
                        {p.oldPrice && p.oldPrice > p.price && (
                          <span className="ml-1.5 text-slate-500 line-through text-[11px]">${p.oldPrice}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            p.stock > 15
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {p.stock} in stock
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-amber-400">★ {p.rating}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {p.colors?.map((c) => (
                            <span
                              key={c.name}
                              title={`${c.name} (${c.quantity} qty)`}
                              className="w-3.5 h-3.5 rounded-full border border-white/30"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ORDERS DATA */}
      {activeTab === "orders" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders by ID, name, city..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={15} className="text-slate-400" />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {filteredOrders.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">{loading ? "Loading orders..." : "No orders to show."}</p>
            ) : !wide ? (
              <ul className="divide-y divide-slate-800">
                {filteredOrders.map((o) => (
                  <li key={o.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono font-bold text-emerald-400">#{o.id}</span>
                      <span className="font-bold text-white">${Number(o.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{o.user_name || "Guest Customer"}</p>
                      <p className="truncate text-xs text-slate-400">{o.user_email}</p>
                      <p className="truncate text-xs text-slate-500">{[o.city, o.payment_method].filter(Boolean).join(" · ")}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <StatusPill status={o.status} />
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 text-sm font-bold text-slate-200 transition hover:bg-slate-700"
                      >
                        <Eye size={15} aria-hidden />
                        Details
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">City / Address</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">#{o.id}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white">{o.user_name}</p>
                        <p className="text-[11px] text-slate-400">{o.user_email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-slate-200 font-semibold">{o.city}</p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]">{o.address}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
                          {o.payment_method}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">${Number(o.total_amount).toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        <StatusPill status={o.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700 transition"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Order statuses are changed under Customer Orders on the dashboard, so customers get their update email.
          </p>
        </div>
      )}

      {/* TAB CONTENT 4: RAW JSON VIEW */}
      {activeTab === "raw-data" && (
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              Live JSON Schema & Records
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {products.length} Products | {orders.length} Orders
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 overflow-auto max-h-[550px] font-mono text-xs text-emerald-300">
            <pre>
              {JSON.stringify(
                {
                  company: "Marhaba Tech",
                  brand_portal: "marhaba-tech.pk",
                  metrics,
                  preset_colors: ADMIN_PRESET_COLORS,
                  categories: ADMIN_BASE_CATEGORIES,
                  products,
                  orders,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto overscroll-contain p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              aria-label="Close order details"
              className="absolute top-3 right-3 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="min-w-10 h-10 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                #{selectedOrder.id}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Order Details</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="min-w-0">
                <span className="text-slate-500 font-medium">Customer:</span>
                <p className="font-bold text-white mt-0.5">{selectedOrder.user_name}</p>
                <p className="text-slate-400 break-all">{selectedOrder.user_email}</p>
                <p className="text-slate-400">{selectedOrder.mobile_number}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Delivery Address:</span>
                <p className="font-bold text-white mt-0.5">{selectedOrder.city}, {selectedOrder.country}</p>
                <p className="text-slate-400 line-clamp-2">{selectedOrder.address}</p>
                <p className="text-emerald-400 mt-1 font-semibold">{selectedOrder.payment_method}</p>
              </div>
            </div>

            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">
              Items Ordered ({selectedOrder.items?.length || 0})
            </h4>

            <div className="space-y-2.5 max-h-48 overflow-y-auto mb-6">
              {selectedOrder.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getImageUrl(item.color_image || item.product_image)}
                      alt={item.product_name}
                      className="w-10 h-10 shrink-0 rounded-lg object-cover border border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{item.product_name}</p>
                      <p className="text-slate-400">
                        Qty: {item.quantity} {item.color && `• Color: ${item.color}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400 shrink-0">${item.price}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <span className="text-sm font-bold text-slate-400">Total Amount</span>
              <span className="text-xl font-black text-white">
                ${Number(selectedOrder.total_amount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
