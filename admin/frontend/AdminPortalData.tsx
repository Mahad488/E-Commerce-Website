import { useState, useMemo } from "react";
import {
  Package,
  DollarSign,
  Box,
  Eye,
  X,
  Search,
  Filter,
  AlertTriangle,
  Download,
  Copy,
  Check,
  Layers,
  Sparkles,
  Tag,
  Palette,
} from "lucide-react";

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export interface ProductColorVariant {
  name: string;
  hex: string;
  image?: string;
  quantity: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  image: string;
  description: string;
  stock: number;
  colors?: ProductColorVariant[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  color?: string;
  color_image?: string;
  product_name?: string;
  product_image?: string;
}

export interface Order {
  id: number;
  user_name?: string;
  user_email?: string;
  total_amount: string | number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | string;
  address?: string;
  city?: string;
  country?: string;
  mobile_number?: string;
  payment_method?: string;
  created_at: string;
  items?: OrderItem[];
}

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
// 3. COMPLETE ADMIN PRODUCTS DATASET
// ==========================================

export const INITIAL_ADMIN_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Premium Casual Jacket",
    category: "Fashion",
    price: 89.99,
    oldPrice: 120,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    description: "A stylish premium casual jacket designed for everyday comfort and modern fashion.",
    stock: 15,
    colors: [
      { name: "Black", hex: "#111827", quantity: 8, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80" },
      { name: "Brown", hex: "#78350f", quantity: 7, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 2,
    name: "Classic Sneakers",
    category: "Fashion",
    price: 65,
    oldPrice: 85,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    description: "Comfortable everyday sneakers with a modern design and durable sole.",
    stock: 20,
    colors: [
      { name: "Red", hex: "#dc2626", quantity: 12, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
      { name: "White", hex: "#ffffff", quantity: 8, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 3,
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 110,
    oldPrice: 140,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    description: "A minimal wristwatch suitable for both casual and formal occasions.",
    stock: 12,
    colors: [
      { name: "White", hex: "#ffffff", quantity: 6, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" },
      { name: "Black", hex: "#111827", quantity: 6, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 4,
    name: "Modern Headphones",
    category: "Electronics",
    price: 75,
    oldPrice: 99,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    description: "Modern headphones designed for immersive audio and comfortable listening.",
    stock: 18,
    colors: [
      { name: "Black", hex: "#111827", quantity: 10, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
      { name: "Navy Blue", hex: "#1e3a8a", quantity: 8, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 5,
    name: "Premium Backpack",
    category: "Lifestyle",
    price: 55,
    oldPrice: 75,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    description: "A versatile backpack for daily use, travel, and carrying essentials.",
    stock: 25,
    colors: [
      { name: "Grey", hex: "#6b7280", quantity: 15, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80" },
      { name: "Black", hex: "#111827", quantity: 10, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 6,
    name: "Wireless Headphones Pro",
    category: "Electronics",
    price: 95,
    oldPrice: 125,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
    description: "Wireless audio headphones with a sleek design for everyday entertainment.",
    stock: 10,
    colors: [
      { name: "Black", hex: "#111827", quantity: 5, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80" },
      { name: "White", hex: "#ffffff", quantity: 5, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 7,
    name: "Classic Sunglasses",
    category: "Accessories",
    price: 35,
    oldPrice: 50,
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
    description: "Classic sunglasses that add a stylish finishing touch to your outfit.",
    stock: 30,
    colors: [
      { name: "Black", hex: "#111827", quantity: 20, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80" },
      { name: "Brown", hex: "#78350f", quantity: 10, image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80" },
    ],
  },
  {
    id: 8,
    name: "Casual T-Shirt",
    category: "Fashion",
    price: 29,
    oldPrice: 40,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    description: "A comfortable casual T-shirt with a clean and versatile everyday style.",
    stock: 40,
    colors: [
      { name: "White", hex: "#ffffff", quantity: 20, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80" },
      { name: "Navy Blue", hex: "#1e3a8a", quantity: 20, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80" },
    ],
  },
];

// ==========================================
// 4. COMPLETE ADMIN ORDERS DATASET
// ==========================================

export const INITIAL_ADMIN_ORDERS: Order[] = [
  {
    id: 1001,
    user_name: "Muhammad Ali",
    user_email: "ali@marhabatech.pk",
    total_amount: 154.99,
    status: "Delivered",
    address: "House 45, Street 12, Gulberg III",
    city: "Lahore",
    country: "Pakistan",
    mobile_number: "+92 300 1234567",
    payment_method: "Cash on Delivery",
    created_at: "2026-10-20T14:32:00Z",
    items: [
      {
        id: 1,
        product_id: 1,
        quantity: 1,
        price: 89.99,
        color: "Black",
        product_name: "Premium Casual Jacket",
        product_image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: 2,
        product_id: 2,
        quantity: 1,
        price: 65.0,
        color: "Red",
        product_name: "Classic Sneakers",
        product_image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: 1002,
    user_name: "Fatima Noor",
    user_email: "fatima.noor@gmail.com",
    total_amount: 110.0,
    status: "Shipped",
    address: "Apartment 4B, Clifton Block 2",
    city: "Karachi",
    country: "Pakistan",
    mobile_number: "+92 321 9876543",
    payment_method: "Card Payment",
    created_at: "2026-10-21T09:15:00Z",
    items: [
      {
        id: 3,
        product_id: 3,
        quantity: 1,
        price: 110.0,
        color: "White",
        product_name: "Minimal Wrist Watch",
        product_image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: 1003,
    user_name: "Usman Tariq",
    user_email: "usman.tariq@yahoo.com",
    total_amount: 170.0,
    status: "Processing",
    address: "Sector F-7/2, Street 18",
    city: "Islamabad",
    country: "Pakistan",
    mobile_number: "+92 333 4567890",
    payment_method: "Cash on Delivery",
    created_at: "2026-10-22T16:45:00Z",
    items: [
      {
        id: 4,
        product_id: 4,
        quantity: 1,
        price: 75.0,
        color: "Black",
        product_name: "Modern Headphones",
        product_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: 5,
        product_id: 6,
        quantity: 1,
        price: 95.0,
        color: "Black",
        product_name: "Wireless Headphones Pro",
        product_image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: 1004,
    user_name: "Ayesha Khan",
    user_email: "ayesha.k@outlook.com",
    total_amount: 64.0,
    status: "Pending",
    address: "Canal View Society, Main Boulevard",
    city: "Faisalabad",
    country: "Pakistan",
    mobile_number: "+92 304 8889900",
    payment_method: "Cash on Delivery",
    created_at: "2026-10-23T11:20:00Z",
    items: [
      {
        id: 6,
        product_id: 7,
        quantity: 1,
        price: 35.0,
        color: "Black",
        product_name: "Classic Sunglasses",
        product_image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: 7,
        product_id: 8,
        quantity: 1,
        price: 29.0,
        color: "Navy Blue",
        product_name: "Casual T-Shirt",
        product_image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

// ==========================================
// 5. REACT COMPONENT: AdminPortalData
// ==========================================

export default function AdminPortalData() {
  const [products] = useState<Product[]>(INITIAL_ADMIN_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ADMIN_ORDERS);
  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "raw-data">("overview");

  // Filter States
  const [orderFilter, setOrderFilter] = useState<string>("All");
  const [orderSearch, setOrderSearch] = useState<string>("");
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("All");
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  // Computed Metrics
  const metrics = useMemo(() => {
    const totalRev = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
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

  // Status Updater
  const handleUpdateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles size={13} />
            marhaba-tech.pk Admin Data Hub
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Admin Portal Master Data
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Centralized data store for products, orders, categories, colors, and store statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? "Copied JSON!" : "Copy Raw JSON"}
          </button>
          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
          >
            <Download size={14} />
            Export Data File
          </button>
        </div>
      </header>

      {/* Metric KPI Cards */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Products</p>
            <h3 className="text-2xl font-black text-white mt-1">{metrics.totalProducts}</h3>
            <p className="text-xs text-slate-400 mt-1">{metrics.totalInventoryStock} total units in stock</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Box size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Orders</p>
            <h3 className="text-2xl font-black text-white mt-1">{metrics.totalOrders}</h3>
            <p className="text-xs text-emerald-400 mt-1">{metrics.deliveredOrders} orders delivered</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Revenue</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">${metrics.totalRevenue.toFixed(2)}</h3>
            <p className="text-xs text-slate-400 mt-1">Across all completed orders</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Pending Actions</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingOrders}</h3>
            <p className="text-xs text-amber-400 mt-1">{metrics.lowStockCount} items low stock</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6 flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === "overview" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Overview & Presets
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === "products" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Products Data ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
            activeTab === "orders" ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Orders Data ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("raw-data")}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition ${
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
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
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
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
                            src={p.image}
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
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
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
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                            o.status.toLowerCase() === "delivered"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : o.status.toLowerCase() === "shipped"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : o.status.toLowerCase() === "processing"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <option value="Pending" className="bg-slate-900 text-white">Pending</option>
                          <option value="Processing" className="bg-slate-900 text-white">Processing</option>
                          <option value="Shipped" className="bg-slate-900 text-white">Shipped</option>
                          <option value="Delivered" className="bg-slate-900 text-white">Delivered</option>
                        </select>
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
          </div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-x-auto max-h-[550px] font-mono text-xs text-emerald-300">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                #{selectedOrder.id}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Order Details</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 font-medium">Customer:</span>
                <p className="font-bold text-white mt-0.5">{selectedOrder.user_name}</p>
                <p className="text-slate-400">{selectedOrder.user_email}</p>
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
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product_image || "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200"}
                      alt={item.product_name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                    />
                    <div>
                      <p className="font-bold text-white">{item.product_name}</p>
                      <p className="text-slate-400">
                        Qty: {item.quantity} {item.color && `• Color: ${item.color}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-400">${item.price}</span>
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
