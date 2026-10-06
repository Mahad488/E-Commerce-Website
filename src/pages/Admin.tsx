import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { API_BASE_URL } from "../config/api";
import { useToast } from "../context/ToastContext";
import type { Product } from "../data/products";

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
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

  // New Product Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [image, setImage] = useState("");
  const [stock, setStock] = useState("15");

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
        localStorage.removeItem("nova_admin_token");
        navigate("/admin-login");
        return;
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
      console.error("Admin fetch error:", err);
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
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold backdrop-blur-md transition"
              >
                <RefreshCw size={14} />
                Refresh Data
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
            <div className="bg-white rounded-3xl border shadow-sm p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Live Orders Overview
              </h2>

              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">
                  No orders have been placed yet.
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="pb-4">Order #</th>
                      <th className="pb-4">Customer</th>
                      <th className="pb-4">Date</th>
                      <th className="pb-4">Amount</th>
                      <th className="pb-4">Delivery Location</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Delivery Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="py-4 font-black">#{order.id}</td>
                        <td className="py-4">
                          <p className="font-bold text-gray-900">
                            {order.user_name || "Guest Customer"}
                          </p>
                          <p className="text-xs text-gray-400">{order.user_email}</p>
                        </td>
                        <td className="py-4 text-gray-500 text-xs">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-4 font-bold text-orange-500">
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
                            className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold outline-none bg-white"
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
              )}
            </div>
          )}

          {/* Tab 2: Products List */}
          {activeTab === "products" && (
            <div className="bg-white rounded-3xl border shadow-sm p-6 overflow-x-auto">
              <h2 className="text-xl font-bold mb-6 text-gray-900">
                Product Catalog Inventory
              </h2>

              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-4">Product</th>
                    <th className="pb-4">Category</th>
                    <th className="pb-4">Price</th>
                    <th className="pb-4">Stock</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition">
                      <td className="py-4 flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-xl border bg-gray-100"
                        />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-400">ID: #{p.id}</p>
                        </div>
                      </td>
                      <td className="py-4 text-xs font-semibold text-gray-600">
                        {p.category}
                      </td>
                      <td className="py-4 font-bold text-gray-900">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="py-4 font-semibold text-gray-600">
                        {p.stock} units
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-xl transition"
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                        {item.product_image ? (
                          <img
                            src={item.product_image}
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
                          </p>
                          <p className="text-xs text-gray-400">
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

      <Footer />
    </div>
  );
}
