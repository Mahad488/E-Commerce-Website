import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  Plus,
  Trash2,
  RefreshCw,
  LayoutDashboard,
  Box,
  LogOut,
  Eye,
  X,
  MapPin,
  Phone,
  CreditCard,
  Calendar,
  User,
  Mail,
  Globe,
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  Sparkles,
  Layers,
  SlidersHorizontal,
  ExternalLink,
  Tag,
  RotateCcw,
  Pencil,
  Flame,
  Percent,
  Save,
  Palette,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { API_BASE_URL } from "../config/api";
import { useToast } from "../context/ToastContext";
import { products as fallbackProducts, type Product, type ProductColorVariant } from "../data/products";

const PRESET_COLORS = [
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

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  color?: string;
  color_image?: string;
  product_name?: string;
  product_image?: string;
}

interface Order {
  id: number;
  user_name?: string;
  user_email?: string;
  total_amount: string | number;
  status: string;
  address?: string;
  city?: string;
  country?: string;
  mobile_number?: string;
  payment_method?: string;
  created_at: string;
  items?: OrderItem[];
}

export default function Admin() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"orders" | "products" | "add-product">("orders");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Order for Eye Detail Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Orders Filter State (Pending, Processing, Shipped, Delivered)
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");

  const orderCounts = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let shipped = 0;
    let delivered = 0;

    orders.forEach((o) => {
      const s = (o.status || "").toLowerCase();
      if (s === "pending") pending++;
      else if (s === "processing") processing++;
      else if (s === "shipped") shipped++;
      else if (s === "delivered") delivered++;
    });

    return {
      all: orders.length,
      pending,
      processing,
      shipped,
      delivered,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (
        orderStatusFilter !== "All" &&
        (order.status || "").toLowerCase() !== orderStatusFilter.toLowerCase()
      ) {
        return false;
      }

      // Search filter
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchesId = String(order.id).includes(q);
        const matchesName = (order.user_name || "").toLowerCase().includes(q);
        const matchesEmail = (order.user_email || "").toLowerCase().includes(q);
        const matchesCity = (order.city || "").toLowerCase().includes(q);
        const matchesAddress = (order.address || "").toLowerCase().includes(q);
        const matchesMobile = (order.mobile_number || "").toLowerCase().includes(q);
        if (
          !matchesId &&
          !matchesName &&
          !matchesEmail &&
          !matchesCity &&
          !matchesAddress &&
          !matchesMobile
        ) {
          return false;
        }
      }

      return true;
    });
  }, [orders, orderStatusFilter, orderSearchQuery]);

  // New Product Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("15");

  // Product Filter & Sidebar State
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("all");
  const [productStatusFilter, setProductStatusFilter] = useState<
    "all" | "in-stock" | "low-stock" | "out-of-stock" | "on-sale" | "no-reviews" | "with-reviews"
  >("all");
  const [productSearch, setProductSearch] = useState<string>("");
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  // Edit Product & Sales Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Fashion");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editOldPrice, setEditOldPrice] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editRating, setEditRating] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  // Color Variants State for New and Edit Product
  const [newColors, setNewColors] = useState<ProductColorVariant[]>([]);
  const [editColors, setEditColors] = useState<ProductColorVariant[]>([]);

  // Color Handlers for New Product Form
  const handleAddPresetColorNew = (preset: { name: string; hex: string }) => {
    if (newColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) {
      showToast(`${preset.name} already added`, "info");
      return;
    }
    setNewColors((prev) => [
      ...prev,
      { name: preset.name, hex: preset.hex, quantity: 10, image: image || "" },
    ]);
  };

  const handleAddColorNew = () => {
    setNewColors((prev) => [
      ...prev,
      {
        name: `Color ${prev.length + 1}`,
        hex: "#111827",
        quantity: 10,
        image: image || "",
      },
    ]);
  };

  const handleUpdateColorNew = (
    index: number,
    field: keyof ProductColorVariant,
    value: string | number
  ) => {
    setNewColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveColorNew = (index: number) => {
    setNewColors((prev) => prev.filter((_, i) => i !== index));
  };

  // Color Handlers for Edit Product Modal
  const handleAddPresetColorEdit = (preset: { name: string; hex: string }) => {
    if (editColors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase())) {
      showToast(`${preset.name} already added`, "info");
      return;
    }
    setEditColors((prev) => [
      ...prev,
      { name: preset.name, hex: preset.hex, quantity: 10, image: editImage || "" },
    ]);
  };

  const handleAddColorEdit = () => {
    setEditColors((prev) => [
      ...prev,
      {
        name: `Color ${prev.length + 1}`,
        hex: "#111827",
        quantity: 10,
        image: editImage || "",
      },
    ]);
  };

  const handleUpdateColorEdit = (
    index: number,
    field: keyof ProductColorVariant,
    value: string | number
  ) => {
    setEditColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveColorEdit = (index: number) => {
    setEditColors((prev) => prev.filter((_, i) => i !== index));
  };

  const baseCategories = useMemo(
    () => ["Fashion", "Electronics", "Accessories", "Lifestyle", "Footwear", "Gaming & Tech"],
    []
  );

  const allCategories = useMemo(() => {
    const dynamic = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return Array.from(new Set([...baseCategories, ...dynamic]));
  }, [products, baseCategories]);

  const statusCounts = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let onSale = 0;
    let noReviews = 0;
    let withReviews = 0;

    products.forEach((p) => {
      const stockNum = Number(p.stock) || 0;
      if (stockNum > 5) inStock++;
      else if (stockNum > 0) lowStock++;
      else outOfStock++;

      const priceNum = Number(p.price) || 0;
      const oldPriceNum = Number(p.oldPrice) || 0;
      if (oldPriceNum > priceNum) onSale++;

      const ratingNum = Number(p.rating) || 0;
      if (ratingNum === 0) noReviews++;
      else withReviews++;
    });

    return {
      all: products.length,
      inStock,
      lowStock,
      outOfStock,
      onSale,
      noReviews,
      withReviews,
    };
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stockNum = Number(p.stock) || 0;
      const ratingNum = Number(p.rating) || 0;
      const priceNum = Number(p.price) || 0;
      const oldPriceNum = Number(p.oldPrice) || 0;

      // Status Filter
      if (productStatusFilter === "in-stock" && stockNum <= 5) return false;
      if (productStatusFilter === "low-stock" && (stockNum <= 0 || stockNum > 5)) return false;
      if (productStatusFilter === "out-of-stock" && stockNum > 0) return false;
      if (productStatusFilter === "on-sale" && !(oldPriceNum > priceNum)) return false;
      if (productStatusFilter === "no-reviews" && ratingNum > 0) return false;
      if (productStatusFilter === "with-reviews" && ratingNum === 0) return false;

      // Category Filter
      if (
        productCategoryFilter !== "all" &&
        p.category?.toLowerCase() !== productCategoryFilter.toLowerCase()
      ) {
        return false;
      }

      // Search Query
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesCat = p.category?.toLowerCase().includes(q);
        const matchesId = String(p.id).includes(q);
        if (!matchesName && !matchesCat && !matchesId) return false;
      }

      return true;
    });
  }, [products, productStatusFilter, productCategoryFilter, productSearch]);

  const handleResetFilters = () => {
    setProductCategoryFilter("all");
    setProductStatusFilter("all");
    setProductSearch("");
  };

  // Open Edit Modal for a Product
  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name || "");
    setEditCategory(p.category || "Fashion");
    setEditDescription(p.description || "");
    setEditPrice(String(p.price ?? ""));
    setEditOldPrice(p.oldPrice ? String(p.oldPrice) : "");
    setEditImage(p.image || "");
    setEditStock(String(p.stock ?? "10"));
    setEditRating(String(p.rating ?? "0"));
    setEditColors(p.colors && Array.isArray(p.colors) ? JSON.parse(JSON.stringify(p.colors)) : []);
  };

  // Apply Quick Sale Discount Percentage
  const applySaleDiscount = (percent: number) => {
    const baseOriginal =
      editOldPrice && Number(editOldPrice) > Number(editPrice)
        ? Number(editOldPrice)
        : Number(editPrice) || 100;

    const discounted = Number((baseOriginal * (1 - percent / 100)).toFixed(2));
    setEditOldPrice(String(baseOriginal));
    setEditPrice(String(discounted));
  };

  // End or remove sale discount
  const removeSale = () => {
    if (editOldPrice && Number(editOldPrice) > 0) {
      setEditPrice(String(editOldPrice));
    }
    setEditOldPrice("");
  };

  // Save edited product
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim() || !editPrice) {
      showToast("Product name and price are required", "error");
      return;
    }

    const token = localStorage.getItem("nova_admin_token");
    setIsEditSaving(true);

    const updatedData: Product = {
      id: editingProduct.id,
      name: editName.trim(),
      category: editCategory,
      description: editDescription,
      price: Number(editPrice),
      oldPrice: editOldPrice && Number(editOldPrice) > 0 ? Number(editOldPrice) : 0,
      image: editImage.trim() || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600",
      stock: Number(editStock) || 0,
      rating: Number(editRating) || 0,
      colors: editColors,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...updatedData,
          oldPrice: updatedData.oldPrice > 0 ? updatedData.oldPrice : null,
          colors: editColors,
        }),
      });

      if (res.ok) {
        showToast(`Product "${editName}" updated successfully! 🎉`, "success");
        setEditingProduct(null);
        fetchData();
      } else {
        // Fallback local update
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updatedData, id: p.id } : p))
        );
        showToast(`Product "${editName}" updated in catalog! 🎉`, "success");
        setEditingProduct(null);
      }
    } catch (err) {
      console.warn("Product update API error, falling back to local update:", err);
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updatedData, id: p.id } : p))
      );
      showToast(`Product "${editName}" updated locally!`, "success");
      setEditingProduct(null);
    } finally {
      setIsEditSaving(false);
    }
  };

  const fetchData = async () => {
    // Verify token exists before fetching
    const token = localStorage.getItem("nova_admin_token");
    if (!token) {
      navigate("/admin-login");
      return;
    }

    try {
      setLoading(true);

      const headers = { Authorization: `Bearer ${token}` };

      // Fetch products
      const pRes = await fetch(`${API_BASE_URL}/api/products`, { headers });
      const pData = await pRes.json();
      if (pRes.ok && Array.isArray(pData.products)) {
        setProducts(pData.products);
      }

      // Fetch all orders
      const oRes = await fetch(`${API_BASE_URL}/api/orders/all`, { headers });

      // If 401 — admin token expired
      if (oRes.status === 401) {
        if (token !== "demo_admin_preview_token") {
          localStorage.removeItem("nova_admin_token");
          navigate("/admin-login");
          return;
        }
      }

      const oData = await oRes.json();
      if (oRes.ok && Array.isArray(oData.orders)) {
        setOrders(oData.orders);
        // If modal is open, keep selected order updated
        if (selectedOrderDetails) {
          const updated = oData.orders.find((o: Order) => o.id === selectedOrderDetails.id);
          if (updated) setSelectedOrderDetails(updated);
        }
      }
    } catch (err) {
      console.warn("Admin fetch error, using fallback catalog:", err);
      setProducts((prev) => (prev.length ? prev : fallbackProducts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("nova_admin_token");
    if (!token) {
      navigate("/admin-login");
      return;
    }
    fetchData();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    const token = localStorage.getItem("nova_admin_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showToast(`Order #${orderId} status updated to ${newStatus}`, "success");
        fetchData();
      }
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const token = localStorage.getItem("nova_admin_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showToast("Product deleted successfully", "info");
        fetchData();
      }
    } catch (err) {
      showToast("Failed to delete product", "error");
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      showToast("Please enter product name and price", "error");
      return;
    }
    const token = localStorage.getItem("nova_admin_token");
    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          category,
          description,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          image,
          stock: Number(stock) || 10,
          colors: newColors,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Product added to catalog! 📦", "success");
        setName("");
        setDescription("");
        setPrice("");
        setOldPrice("");
        setImage("");
        setNewColors([]);
        setActiveTab("products");
        fetchData();
      } else {
        showToast(data.message || "Failed to create product", "error");
      }
    } catch (err) {
      showToast("Failed to create product", "error");
    }
  };

  const totalRevenue = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header */}
        <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
          <div className="max-w-7xl mx-auto px-5 lg:px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                <LayoutDashboard size={14} />
                Admin Portal
              </div>
              <h1 className="text-3xl md:text-5xl font-black">Store Dashboard</h1>
              <p className="text-gray-400 mt-2 text-sm">
                Manage live products, stock inventory, and customer delivery orders.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold backdrop-blur-md transition disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                {loading ? "Loading..." : "Refresh Data"}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("nova_admin_token");
                  navigate("/admin-login");
                }}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 px-5 py-2.5 rounded-full text-xs font-bold backdrop-blur-md transition"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Products
                </p>
                <h3 className="text-3xl font-black text-gray-900 mt-2">
                  {products.length}
                </h3>
              </div>
              <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl">
                <Box size={28} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Orders
                </p>
                <h3 className="text-3xl font-black text-gray-900 mt-2">
                  {orders.length}
                </h3>
              </div>
              <div className="bg-orange-100 text-orange-600 p-4 rounded-2xl">
                <Package size={28} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Total Revenue
                </p>
                <h3 className="text-3xl font-black text-emerald-600 mt-2">
                  ${totalRevenue.toFixed(2)}
                </h3>
              </div>
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-2xl">
                <DollarSign size={28} />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-8 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-4 text-sm font-bold border-b-2 transition shrink-0 ${
                activeTab === "orders"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Customer Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`pb-4 text-sm font-bold border-b-2 transition shrink-0 ${
                activeTab === "products"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              Manage Products ({products.length})
            </button>
            <button
              onClick={() => setActiveTab("add-product")}
              className={`pb-4 text-sm font-bold border-b-2 transition shrink-0 flex items-center gap-1.5 ${
                activeTab === "add-product"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <Plus size={16} />
              Add New Product
            </button>
          </div>

          {/* Tab 1: Orders List */}
          {activeTab === "orders" && (
            <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-6">
              {/* Header and Filter Controls Box */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Package className="text-orange-500" size={24} />
                    Live Orders Overview
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing <span className="font-bold text-gray-900">{filteredOrders.length}</span> of{" "}
                    <span className="font-bold text-gray-900">{orders.length}</span> customer orders
                  </p>
                </div>

                {/* Filter Controls: Status Dropdown Box & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Status Selection Box */}
                  <div
                    className={`flex items-center gap-2.5 border rounded-2xl px-4 py-2 transition shadow-xs ${
                      orderStatusFilter === "Pending"
                        ? "bg-amber-50/90 border-amber-300 text-amber-900"
                        : orderStatusFilter === "Processing"
                        ? "bg-blue-50/90 border-blue-300 text-blue-900"
                        : orderStatusFilter === "Shipped"
                        ? "bg-purple-50/90 border-purple-300 text-purple-900"
                        : orderStatusFilter === "Delivered"
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
                        : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  >
                    <Filter
                      size={15}
                      className={`shrink-0 ${
                        orderStatusFilter === "Pending"
                          ? "text-amber-600"
                          : orderStatusFilter === "Processing"
                          ? "text-blue-600"
                          : orderStatusFilter === "Shipped"
                          ? "text-purple-600"
                          : orderStatusFilter === "Delivered"
                          ? "text-emerald-600"
                          : "text-orange-500"
                      }`}
                    />
                    <span className="text-xs font-black uppercase tracking-wider shrink-0 opacity-80">
                      Order Status:
                    </span>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="bg-transparent text-xs font-black outline-none cursor-pointer pr-1"
                    >
                      <option value="All" className="text-gray-900 bg-white">All Statuses ({orderCounts.all})</option>
                      <option value="Pending" className="text-amber-800 bg-white">Pending ({orderCounts.pending})</option>
                      <option value="Processing" className="text-blue-800 bg-white">Processing ({orderCounts.processing})</option>
                      <option value="Shipped" className="text-purple-800 bg-white">Shipped ({orderCounts.shipped})</option>
                      <option value="Delivered" className="text-emerald-800 bg-white">Delivered ({orderCounts.delivered})</option>
                    </select>
                  </div>

                  {/* Orders Search Box */}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search order #, customer, city..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full sm:w-60 bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-8 py-2 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear search"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Status Filter Buttons with Live Badges */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "All Orders", value: "All", count: orderCounts.all },
                  { label: "Pending", value: "Pending", count: orderCounts.pending },
                  { label: "Processing", value: "Processing", count: orderCounts.processing },
                  { label: "Shipped", value: "Shipped", count: orderCounts.shipped },
                  { label: "Delivered", value: "Delivered", count: orderCounts.delivered },
                ].map((st) => {
                  const isActive = orderStatusFilter.toLowerCase() === st.value.toLowerCase();
                  return (
                    <button
                      key={st.value}
                      onClick={() => setOrderStatusFilter(st.value)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? st.value === "Pending"
                            ? "bg-amber-500 text-white shadow-xs"
                            : st.value === "Processing"
                            ? "bg-blue-600 text-white shadow-xs"
                            : st.value === "Shipped"
                            ? "bg-purple-600 text-white shadow-xs"
                            : st.value === "Delivered"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-gray-900 text-white shadow-xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                      }`}
                    >
                      <span>{st.label}</span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white text-gray-700 border border-gray-200"
                        }`}
                      >
                        {st.count}
                      </span>
                    </button>
                  );
                })}

                {(orderStatusFilter !== "All" || orderSearchQuery) && (
                  <button
                    onClick={() => {
                      setOrderStatusFilter("All");
                      setOrderSearchQuery("");
                    }}
                    className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-800 underline decoration-dashed transition"
                  >
                    <RotateCcw size={12} />
                    Reset Order Filters
                  </button>
                )}
              </div>

              {/* Orders Table */}
              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No orders have been placed yet.
                </p>
              ) : filteredOrders.length === 0 ? (
                <div className="py-14 text-center px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="w-14 h-14 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Package size={26} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    No {orderStatusFilter !== "All" ? `"${orderStatusFilter}"` : ""} orders found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mb-5">
                    {orderSearchQuery
                      ? `No orders matching query "${orderSearchQuery}" with status "${orderStatusFilter}".`
                      : `There are currently no customer orders marked as "${orderStatusFilter}".`}
                  </p>
                  <button
                    onClick={() => {
                      setOrderStatusFilter("All");
                      setOrderSearchQuery("");
                    }}
                    className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    <RotateCcw size={13} />
                    Show All Orders
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <th className="pb-4">Order #</th>
                        <th className="pb-4">Customer</th>
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Items & Color</th>
                        <th className="pb-4">Amount</th>
                        <th className="pb-4">Delivery Location</th>
                        <th className="pb-4">Status</th>
                        <th className="pb-4 text-right">Delivery Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 font-black">#{order.id}</td>
                          <td className="py-4">
                            <p className="font-bold text-gray-900">
                              {order.user_name || "Guest Customer"}
                            </p>
                            <p className="text-xs text-gray-400">{order.user_email}</p>
                          </td>
                          <td className="py-4 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 min-w-[200px]">
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-1.5">
                                {order.items.map((it) => (
                                  <div key={it.id} className="flex items-center gap-2">
                                    {it.color_image || it.product_image ? (
                                      <img
                                        src={it.color_image || it.product_image}
                                        alt=""
                                        className="w-7 h-7 object-cover rounded-md border bg-gray-50 shrink-0"
                                      />
                                    ) : null}
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-gray-900 truncate">
                                        {it.product_name || `Product #${it.product_id}`}
                                      </p>
                                      <span className="inline-flex items-center gap-1 text-[11px] font-black bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-md mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                                        Color: <span className="text-orange-600">{it.color || "Standard"}</span>
                                        <span className="text-gray-400 font-normal">({it.quantity}x)</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Standard</span>
                            )}
                          </td>
                          <td className="py-4 font-bold text-orange-500 whitespace-nowrap">
                            ${Number(order.total_amount).toFixed(2)}
                          </td>
                          <td className="py-4 text-xs text-gray-600 max-w-xs truncate">
                            {order.address ? `${order.address}, ${order.city}` : "N/A"}
                          </td>
                          <td className="py-4">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateStatus(order.id, e.target.value)
                              }
                              className={`border rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition ${
                                order.status === "Pending"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : order.status === "Processing"
                                  ? "bg-blue-50 text-blue-800 border-blue-300"
                                  : order.status === "Shipped"
                                  ? "bg-purple-50 text-purple-800 border-purple-300"
                                  : order.status === "Delivered"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : "bg-white text-gray-800 border-gray-200"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => setSelectedOrderDetails(order)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-3 py-1.5 rounded-xl transition"
                              title="View Customer Delivery Details"
                            >
                              <Eye size={15} />
                              View Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Products List with Status & Category Slidebar */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border shadow-sm">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    Product Catalog & Inventory
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> of{" "}
                    <span className="font-bold text-gray-900">{products.length}</span> products
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                    className="lg:hidden flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md transition"
                  >
                    <SlidersHorizontal size={14} />
                    {showMobileSidebar ? "Hide Filters" : "Filter Slidebar"}
                  </button>
                  <button
                    onClick={() => setActiveTab("add-product")}
                    className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-2xl font-bold text-xs transition shadow-sm"
                  >
                    <Plus size={14} />
                    Add Product
                  </button>
                </div>
              </div>

              {/* Active Filter Chips */}
              {(productStatusFilter !== "all" || productCategoryFilter !== "all" || productSearch) && (
                <div className="flex flex-wrap items-center gap-2 p-3.5 bg-orange-50 border border-orange-200/80 rounded-2xl">
                  <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5 pl-1">
                    <Filter size={13} className="text-orange-500" /> Active Filters:
                  </span>

                  {productStatusFilter !== "all" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-orange-700 border border-orange-200 px-3 py-1 rounded-xl shadow-xs">
                      Status:{" "}
                      {productStatusFilter === "in-stock"
                        ? "In Stock (>5)"
                        : productStatusFilter === "low-stock"
                        ? "Low Stock (1-5)"
                        : productStatusFilter === "out-of-stock"
                        ? "Out of Stock (0)"
                        : productStatusFilter === "on-sale"
                        ? "On Sale Deals 🔥"
                        : productStatusFilter === "no-reviews"
                        ? "New (No Reviews)"
                        : "Rated Products"}
                      <button
                        onClick={() => setProductStatusFilter("all")}
                        className="hover:text-red-600 ml-0.5"
                        title="Remove status filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}

                  {productCategoryFilter !== "all" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-orange-700 border border-orange-200 px-3 py-1 rounded-xl shadow-xs">
                      Category: {productCategoryFilter}
                      <button
                        onClick={() => setProductCategoryFilter("all")}
                        className="hover:text-red-600 ml-0.5"
                        title="Remove category filter"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}

                  {productSearch && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-orange-700 border border-orange-200 px-3 py-1 rounded-xl shadow-xs">
                      Search: "{productSearch}"
                      <button
                        onClick={() => setProductSearch("")}
                        className="hover:text-red-600 ml-0.5"
                        title="Clear search query"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-800 underline decoration-dashed transition"
                  >
                    <RotateCcw size={12} />
                    Reset All
                  </button>
                </div>
              )}

              {/* Two-Column Layout: Slidebar + Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* 1. Products Slidebar (Filters & Statuses) */}
                <aside
                  className={`lg:col-span-4 xl:col-span-3 ${
                    showMobileSidebar ? "block" : "hidden lg:block"
                  } transition-all`}
                >
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 space-y-6 lg:sticky lg:top-24">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                          <SlidersHorizontal size={16} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">Inventory Slidebar</h3>
                          <p className="text-[11px] text-gray-400">Filter by stock & category</p>
                        </div>
                      </div>
                      {(productStatusFilter !== "all" ||
                        productCategoryFilter !== "all" ||
                        productSearch) && (
                        <button
                          onClick={handleResetFilters}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1"
                          title="Reset all filters"
                        >
                          <RotateCcw size={11} />
                          Reset
                        </button>
                      )}
                    </div>

                    {/* Quick Search */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Search Products
                      </label>
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search title, category..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-7 py-2 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                        />
                        {productSearch && (
                          <button
                            onClick={() => setProductSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product Stock Statuses */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Package size={14} className="text-orange-500" />
                          Stock Status
                        </h4>
                        {productStatusFilter !== "all" && (
                          <button
                            onClick={() => setProductStatusFilter("all")}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                          >
                            All
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {/* All Products */}
                        <button
                          onClick={() => setProductStatusFilter("all")}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "all"
                              ? "bg-gray-900 text-white shadow-xs"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Box size={14} />
                            All Items
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "all"
                                ? "bg-white/20 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {statusCounts.all}
                          </span>
                        </button>

                        {/* In Stock */}
                        <button
                          onClick={() => setProductStatusFilter("in-stock")}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "in-stock"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <CheckCircle2
                              size={14}
                              className={
                                productStatusFilter === "in-stock"
                                  ? "text-white"
                                  : "text-emerald-600"
                              }
                            />
                            In Stock (&gt; 5)
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "in-stock"
                                ? "bg-white/20 text-white"
                                : "bg-emerald-200 text-emerald-900"
                            }`}
                          >
                            {statusCounts.inStock}
                          </span>
                        </button>

                        {/* Low Stock */}
                        <button
                          onClick={() => setProductStatusFilter("low-stock")}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "low-stock"
                              ? "bg-amber-500 text-white shadow-xs"
                              : "bg-amber-50 text-amber-900 hover:bg-amber-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <AlertTriangle
                              size={14}
                              className={
                                productStatusFilter === "low-stock"
                                  ? "text-white"
                                  : "text-amber-600"
                              }
                            />
                            Low Stock (1 - 5)
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "low-stock"
                                ? "bg-white/20 text-white"
                                : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {statusCounts.lowStock}
                          </span>
                        </button>

                        {/* Out of Stock */}
                        <button
                          onClick={() => setProductStatusFilter("out-of-stock")}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "out-of-stock"
                              ? "bg-red-600 text-white shadow-xs"
                              : "bg-red-50 text-red-800 hover:bg-red-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <XCircle
                              size={14}
                              className={
                                productStatusFilter === "out-of-stock"
                                  ? "text-white"
                                  : "text-red-600"
                              }
                            />
                            Out of Stock (0)
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "out-of-stock"
                                ? "bg-white/20 text-white"
                                : "bg-red-200 text-red-900"
                            }`}
                          >
                            {statusCounts.outOfStock}
                          </span>
                        </button>

                        {/* On Sale Deals */}
                        <button
                          onClick={() =>
                            setProductStatusFilter(
                              productStatusFilter === "on-sale" ? "all" : "on-sale"
                            )
                          }
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "on-sale"
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-rose-50 text-rose-900 hover:bg-rose-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Flame
                              size={14}
                              className={
                                productStatusFilter === "on-sale"
                                  ? "text-white fill-white"
                                  : "text-rose-600 fill-rose-600"
                              }
                            />
                            On Sale Deals
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "on-sale"
                                ? "bg-white/20 text-white"
                                : "bg-rose-200 text-rose-900"
                            }`}
                          >
                            {statusCounts.onSale}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Review Statuses */}
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        Review Status
                      </h4>

                      <div className="space-y-1.5">
                        <button
                          onClick={() =>
                            setProductStatusFilter(
                              productStatusFilter === "no-reviews" ? "all" : "no-reviews"
                            )
                          }
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "no-reviews"
                              ? "bg-purple-600 text-white shadow-xs"
                              : "bg-purple-50 text-purple-900 hover:bg-purple-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Sparkles
                              size={14}
                              className={
                                productStatusFilter === "no-reviews"
                                  ? "text-white"
                                  : "text-purple-600"
                              }
                            />
                            New (No Reviews)
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "no-reviews"
                                ? "bg-white/20 text-white"
                                : "bg-purple-200 text-purple-900"
                            }`}
                          >
                            {statusCounts.noReviews}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            setProductStatusFilter(
                              productStatusFilter === "with-reviews" ? "all" : "with-reviews"
                            )
                          }
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition text-left ${
                            productStatusFilter === "with-reviews"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-amber-50/70 text-amber-900 hover:bg-amber-100/80"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Star
                              size={14}
                              className={
                                productStatusFilter === "with-reviews"
                                  ? "text-white fill-white"
                                  : "text-amber-500 fill-amber-500"
                              }
                            />
                            Has Customer Reviews
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productStatusFilter === "with-reviews"
                                ? "bg-white/20 text-white"
                                : "bg-amber-200 text-amber-900"
                            }`}
                          >
                            {statusCounts.withReviews}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers size={14} className="text-orange-500" />
                          Categories
                        </h4>
                        {productCategoryFilter !== "all" && (
                          <button
                            onClick={() => setProductCategoryFilter("all")}
                            className="text-[11px] font-bold text-orange-600 hover:text-orange-700"
                          >
                            All
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        <button
                          onClick={() => setProductCategoryFilter("all")}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                            productCategoryFilter === "all"
                              ? "bg-orange-500 text-white shadow-xs"
                              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Tag size={13} />
                            All Categories
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              productCategoryFilter === "all"
                                ? "bg-white/20 text-white"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {products.length}
                          </span>
                        </button>

                        {allCategories.map((cat) => {
                          const isSelected =
                            productCategoryFilter.toLowerCase() === cat.toLowerCase();
                          const count = categoryCounts[cat] || 0;
                          return (
                            <button
                              key={cat}
                              onClick={() => setProductCategoryFilter(isSelected ? "all" : cat)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                                isSelected
                                  ? "bg-orange-500 text-white shadow-xs"
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <span className="truncate pr-2">{cat}</span>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </aside>

                {/* 2. Filtered Products Table */}
                <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                  {filteredProducts.length === 0 ? (
                    <div className="py-20 text-center px-4">
                      <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Filter size={28} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        No products match this selection
                      </h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
                        No items found for the selected status "{productStatusFilter}" and category "
                        {productCategoryFilter}".
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition"
                      >
                        <RotateCcw size={14} />
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            <th className="py-4 px-6">Product</th>
                            <th className="py-4 px-4">Category</th>
                            <th className="py-4 px-4">Stock Status</th>
                            <th className="py-4 px-4">Price</th>
                            <th className="py-4 px-4">Reviews</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredProducts.map((p) => {
                            const stockNum = Number(p.stock) || 0;
                            const ratingNum = Number(p.rating) || 0;

                            return (
                              <tr key={p.id} className="hover:bg-gray-50/80 transition">
                                {/* Product info */}
                                <td className="py-4 px-6 flex items-center gap-3">
                                  <img
                                    src={p.image}
                                    alt={p.name}
                                    className="w-12 h-12 object-cover rounded-xl border border-gray-200 bg-gray-100 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-900 line-clamp-1 text-sm">
                                      {p.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <p className="text-xs text-gray-400">ID: #{p.id}</p>
                                      {p.colors && p.colors.length > 0 && (
                                        <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded-md">
                                          {p.colors.slice(0, 4).map((c, ci) => (
                                            <span
                                              key={ci}
                                              className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs"
                                              style={{ backgroundColor: c.hex || "#000" }}
                                              title={`${c.name} (${c.quantity} in stock)`}
                                            />
                                          ))}
                                          <span className="text-[10px] text-gray-500 font-bold">
                                            {p.colors.length} {p.colors.length === 1 ? "color" : "colors"}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Category */}
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => setProductCategoryFilter(p.category)}
                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 transition"
                                    title={`Filter category: ${p.category}`}
                                  >
                                    {p.category}
                                  </button>
                                </td>

                                {/* Stock Status Badge */}
                                <td className="py-4 px-4">
                                  {stockNum > 5 ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      In Stock ({stockNum})
                                    </span>
                                  ) : stockNum > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                      <AlertTriangle size={12} className="text-amber-600" />
                                      Low Stock ({stockNum})
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/80">
                                      <XCircle size={12} className="text-red-600" />
                                      Out of Stock
                                    </span>
                                  )}
                                </td>

                                {/* Price */}
                                <td className="py-4 px-4">
                                  <div className="flex flex-col">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="font-bold text-gray-900">
                                        ${Number(p.price).toFixed(2)}
                                      </span>
                                      {p.oldPrice && Number(p.oldPrice) > Number(p.price) && (
                                        <span className="text-xs text-gray-400 line-through">
                                          ${Number(p.oldPrice).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {p.oldPrice && Number(p.oldPrice) > Number(p.price) && (
                                      <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md w-fit">
                                        <Flame size={10} className="fill-rose-500 text-rose-500" />
                                        SALE -{Math.round(((Number(p.oldPrice) - Number(p.price)) / Number(p.oldPrice)) * 100)}%
                                      </span>
                                    )}
                                  </div>
                                </td>

                                {/* Reviews */}
                                <td className="py-4 px-4">
                                  {ratingNum === 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
                                      <Sparkles size={11} />
                                      New · 0 reviews
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                                      <Star size={11} className="fill-amber-400 text-amber-400" />
                                      {ratingNum.toFixed(1)}
                                    </span>
                                  )}
                                </td>

                                {/* Actions */}
                                <td className="py-4 px-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditModal(p)}
                                      className="p-2 rounded-xl text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 transition shadow-xs"
                                      title="Edit product details, price & sales"
                                    >
                                      <Pencil size={15} />
                                    </button>
                                    <a
                                      href={`/product/${p.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-xl text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 transition"
                                      title="View Product in Store"
                                    >
                                      <ExternalLink size={15} />
                                    </a>
                                    <button
                                      onClick={() => handleDeleteProduct(p.id)}
                                      className="p-2 rounded-xl text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 transition"
                                      title="Delete Product"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Add New Product */}
          {activeTab === "add-product" && (
            <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Add New Product To Catalog
              </h2>

              <form onSubmit={handleAddProduct} className="space-y-5 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premium Leather Jacket"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white"
                    >
                      <option value="Fashion">Fashion</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Lifestyle">Lifestyle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Price ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 89.99"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Old / Discount Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 120.00"
                      value={oldPrice}
                      onChange={(e) => setOldPrice(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Initial Stock Count
                    </label>
                    <input
                      type="number"
                      placeholder="15"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Image URL (Unsplash or Static Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the product details and key features..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Product Color Variants & Photos Section */}
                <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                        <Palette size={15} className="text-orange-500" />
                        Color Options, Specific Quantities & Photos ({newColors.length})
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Define available product colors, specific stock in each color, and color photo.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddColorNew}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-white bg-orange-100/80 hover:bg-orange-500 px-3.5 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <Plus size={13} />
                      Add Color Option
                    </button>
                  </div>

                  {/* Quick Color Presets */}
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Quick Add Popular Color Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_COLORS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleAddPresetColorNew(preset)}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs"
                            style={{ backgroundColor: preset.hex }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Variants List */}
                  {newColors.length === 0 ? (
                    <div className="text-center py-4 px-3 bg-white rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-500 font-medium">
                        No color options added yet. (Product will use main photo and general stock).
                      </p>
                      <button
                        type="button"
                        onClick={handleAddColorNew}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                      >
                        <Plus size={12} /> Add first color variant
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newColors.map((col, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                            {/* Color Swatch & Name */}
                            <div className="sm:col-span-6 flex items-center gap-2">
                              <input
                                type="color"
                                value={col.hex || "#000000"}
                                onChange={(e) => handleUpdateColorNew(idx, "hex", e.target.value)}
                                className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
                                title="Pick swatch color"
                              />
                              <input
                                type="text"
                                placeholder="Color name (e.g. Matte Black)"
                                value={col.name}
                                onChange={(e) => handleUpdateColorNew(idx, "name", e.target.value)}
                                required
                                className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500"
                              />
                            </div>

                            {/* Quantity in this color */}
                            <div className="sm:col-span-4 flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-gray-400 uppercase shrink-0">
                                Qty:
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="10"
                                value={col.quantity}
                                onChange={(e) => handleUpdateColorNew(idx, "quantity", Number(e.target.value) || 0)}
                                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 outline-none focus:border-orange-500"
                              />
                            </div>

                            {/* Remove button */}
                            <div className="sm:col-span-2 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveColorNew(idx)}
                                className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition"
                                title="Remove this color"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Specific Photo for this color */}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                            <input
                              type="url"
                              placeholder="Photo URL for this color (Unsplash or image link)"
                              value={col.image || ""}
                              onChange={(e) => handleUpdateColorNew(idx, "image", e.target.value)}
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-500 bg-gray-50/50"
                            />
                            {col.image && (
                              <img
                                src={col.image}
                                alt={col.name}
                                className="w-8 h-8 object-cover rounded-lg border border-gray-200 bg-gray-100 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";
                                }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-black text-white py-4 rounded-full font-bold text-sm hover:bg-orange-500 transition shadow-lg"
                >
                  Create Product
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* EYE BUTTON: DELIVERY DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6 relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black text-gray-900">
                    Order #{selectedOrderDetails.id} Details
                  </h3>
                  <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                    {selectedOrderDetails.status}
                  </span>
                </div>

                {/* Color(s) summary in modal header */}
                {selectedOrderDetails.items && selectedOrderDetails.items.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Color:
                    </span>
                    {Array.from(
                      new Set(selectedOrderDetails.items.map((it) => it.color || "Standard"))
                    ).map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-orange-900 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                        {col}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                  <Calendar size={14} />
                  Placed on {new Date(selectedOrderDetails.created_at).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer & Location Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Contact */}
              <div className="bg-gray-50 p-5 rounded-2xl border space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <User size={15} className="text-orange-500" />
                  Customer Information
                </h4>
                <p className="font-bold text-gray-900 text-base">
                  {selectedOrderDetails.user_name || "Guest Customer"}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400" />
                  {selectedOrderDetails.user_email || "N/A"}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Phone size={13} className="text-gray-400" />
                  {selectedOrderDetails.mobile_number || "Not provided"}
                </p>
              </div>

              {/* Delivery Address */}
              <div className="bg-gray-50 p-5 rounded-2xl border space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                  <MapPin size={15} className="text-orange-500" />
                  Delivery Location
                </h4>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {selectedOrderDetails.address || "No street address provided"}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Globe size={13} className="text-gray-400" />
                  {selectedOrderDetails.city ? `${selectedOrderDetails.city}, ` : ""}
                  {selectedOrderDetails.country || "Pakistan"}
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-1">
                  <CreditCard size={13} className="text-gray-400" />
                  Payment: <span className="font-bold text-gray-800">{selectedOrderDetails.payment_method || "COD"}</span>
                </p>
              </div>
            </div>

            {/* Order Items Purchased */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <ShoppingBag size={15} className="text-orange-500" />
                Purchased Items ({selectedOrderDetails.items?.length || 0})
              </h4>

              {!selectedOrderDetails.items || selectedOrderDetails.items.length === 0 ? (
                <p className="text-xs text-gray-400 py-3 bg-gray-50 rounded-xl text-center">
                  Item details not available.
                </p>
              ) : (
                <div className="divide-y border rounded-2xl overflow-hidden text-sm">
                  {selectedOrderDetails.items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        {item.color_image || item.product_image ? (
                          <img
                            src={item.color_image || item.product_image}
                            alt={item.product_name}
                            className="w-12 h-12 object-cover rounded-xl border bg-gray-100 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-xl border flex items-center justify-center shrink-0">
                            <Box size={20} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-xs md:text-sm line-clamp-1">
                            {item.product_name || `Product #${item.product_id}`}
                            {item.color ? (
                              <span className="text-orange-600 font-bold ml-1.5">({item.color})</span>
                            ) : null}
                          </p>
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-orange-900 bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-lg">
                              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                              Color: <span className="text-orange-600 font-black">{item.color || "Standard"}</span>
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Qty: {item.quantity} × ${Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 text-xs md:text-sm">
                        ${(Number(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Footer */}
            <div className="border-t pt-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Grand Total Amount</p>
                <p className="text-2xl font-black text-orange-500">
                  ${Number(selectedOrderDetails.total_amount).toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="bg-black text-white hover:bg-orange-500 px-6 py-2.5 rounded-full text-xs font-bold transition shadow"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT & SALES / DISCOUNT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6 relative">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <Pencil size={16} />
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-gray-900">
                    Edit Product & Pricing
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Updating Product ID <span className="font-bold text-gray-700">#{editingProduct.id}</span> — {editingProduct.name}
                </p>
              </div>

              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition"
                title="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Preview Card */}
            <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              <img
                src={editImage || "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600"}
                alt={editName || "Product Preview"}
                className="w-16 h-16 object-cover rounded-xl border border-gray-200 bg-white shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";
                }}
              />
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border">
                    {editCategory}
                  </span>
                  {editOldPrice && Number(editOldPrice) > Number(editPrice) && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-md shadow-xs">
                      <Flame size={11} className="fill-white" />
                      ON SALE (-{Math.round(((Number(editOldPrice) - Number(editPrice)) / Number(editOldPrice)) * 100)}%)
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm truncate">
                  {editName || "Untitled Product"}
                </h4>
                <div className="flex items-baseline justify-center sm:justify-start gap-2 mt-1">
                  <span className="text-base font-black text-gray-900">
                    ${Number(editPrice || 0).toFixed(2)}
                  </span>
                  {editOldPrice && Number(editOldPrice) > Number(editPrice) && (
                    <span className="text-xs text-gray-400 line-through">
                      ${Number(editOldPrice).toFixed(2)}
                    </span>
                  )}
                  {editOldPrice && Number(editOldPrice) > Number(editPrice) && (
                    <span className="text-xs font-bold text-emerald-600">
                      (Save ${(Number(editOldPrice) - Number(editPrice)).toFixed(2)})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveEditProduct} className="space-y-5 text-sm">
              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500 bg-white"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing & Sales Section */}
              <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/50 border border-orange-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                    <Flame size={15} className="text-orange-500 fill-orange-500" />
                    Sales & Discount Pricing
                  </span>
                  {editOldPrice && Number(editOldPrice) > Number(editPrice) ? (
                    <button
                      type="button"
                      onClick={removeSale}
                      className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      End / Remove Sale
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-orange-700">
                      Click preset or set regular price
                    </span>
                  )}
                </div>

                {/* Quick Sale Discount Presets */}
                <div>
                  <p className="text-[11px] font-bold text-orange-900 mb-2">
                    Apply Quick Discount Percentage:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[10, 20, 25, 30, 40, 50, 70].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applySaleDiscount(pct)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                          editOldPrice &&
                          Number(editOldPrice) > Number(editPrice) &&
                          Math.round(((Number(editOldPrice) - Number(editPrice)) / Number(editOldPrice)) * 100) === pct
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-white text-orange-800 border border-orange-200 hover:bg-orange-100/80"
                        }`}
                      >
                        <Percent size={11} />
                        {pct}% OFF
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Regular / Original Price ($)
                      <span className="block text-[11px] text-gray-400 font-normal">
                        (Old price shown with strikethrough)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 120.00"
                      value={editOldPrice}
                      onChange={(e) => setEditOldPrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Current Selling Price ($) <span className="text-red-500">*</span>
                      <span className="block text-[11px] text-gray-400 font-normal">
                        (Final price customer pays at checkout)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 89.99"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-black text-orange-600 outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Stock & Rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Stock Inventory Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 15"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Rating Stars (0 = No reviews)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="e.g. 4.8"
                    value={editRating}
                    onChange={(e) => setEditRating(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Product details, specs, sizing info..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Product Color Variants & Photos Section */}
              <div className="bg-gradient-to-br from-gray-50 to-orange-50/30 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <Palette size={15} className="text-orange-500" />
                      Product Color Options & Specific Photos ({editColors.length})
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Configure color variants, available stock in each color, and specific image.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColorEdit}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-white bg-orange-100 hover:bg-orange-500 px-3.5 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto shadow-2xs"
                  >
                    <Plus size={13} />
                    Add Color Option
                  </button>
                </div>

                {/* Quick Color Presets */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Quick Add Color Preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handleAddPresetColorEdit(preset)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-gray-300 shadow-2xs"
                          style={{ backgroundColor: preset.hex }}
                        />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Variants List */}
                {editColors.length === 0 ? (
                  <div className="text-center py-4 px-3 bg-white rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 font-medium">
                      No color variants configured for this product.
                    </p>
                    <button
                      type="button"
                      onClick={handleAddColorEdit}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                    >
                      <Plus size={12} /> Add first color option
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editColors.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                          {/* Color Swatch & Name */}
                          <div className="sm:col-span-6 flex items-center gap-2">
                            <input
                              type="color"
                              value={col.hex || "#000000"}
                              onChange={(e) => handleUpdateColorEdit(idx, "hex", e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer p-0.5 shrink-0"
                              title="Pick color"
                            />
                            <input
                              type="text"
                              placeholder="Color name (e.g. Navy Blue)"
                              value={col.name}
                              onChange={(e) => handleUpdateColorEdit(idx, "name", e.target.value)}
                              required
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 outline-none focus:border-orange-500"
                            />
                          </div>

                          {/* Quantity */}
                          <div className="sm:col-span-4 flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">
                              Qty:
                            </span>
                            <input
                              type="number"
                              min="0"
                              placeholder="10"
                              value={col.quantity}
                              onChange={(e) => handleUpdateColorEdit(idx, "quantity", Number(e.target.value) || 0)}
                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-900 outline-none focus:border-orange-500"
                            />
                          </div>

                          {/* Remove button */}
                          <div className="sm:col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveColorEdit(idx)}
                              className="p-1.5 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition"
                              title="Delete this color option"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Specific Photo for this color */}
                        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                          <input
                            type="url"
                            placeholder="Specific photo URL for this color"
                            value={col.image || ""}
                            onChange={(e) => handleUpdateColorEdit(idx, "image", e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-orange-500 bg-gray-50/50"
                          />
                          {col.image && (
                            <img
                              src={col.image}
                              alt={col.name}
                              className="w-8 h-8 object-cover rounded-lg border border-gray-200 bg-gray-100 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSaving}
                  className="inline-flex items-center gap-2 bg-black hover:bg-orange-500 text-white px-6 py-2.5 rounded-full text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  <Save size={14} />
                  {isEditSaving ? "Saving Changes..." : "Save Product & Sales"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
