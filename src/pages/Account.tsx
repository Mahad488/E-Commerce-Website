import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  ShoppingBag,
  UserRound,
  PackageCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Mail,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config/api";

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface Order {
  id: number;
  total_amount: string | number;
  status: string;
  address?: string;
  mobile_number?: string;
  city?: string;
  country?: string;
  payment_method?: string;
  created_at: string;
}

const ORDER_STEPS = ["Pending", "Processing", "Shipped", "Delivered"];

export default function Account() {
  const { user, token, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"orders" | "password" | "details">("orders");

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Password Requirements Check
  const reqMinLength = newPassword.length >= 8;
  const reqUpper = /[A-Z]/.test(newPassword);
  const reqLower = /[a-z]/.test(newPassword);
  const reqNumber = /[0-9]/.test(newPassword);
  const reqSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordStrong = reqMinLength && reqUpper && reqLower && reqNumber && reqSpecial;

  useEffect(() => {
    let isMounted = true;

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const profileRes = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (isMounted && profileData.user) {
            setProfile(profileData.user);
          }
        } else if (profileRes.status === 401) {
          logout();
          navigate("/login");
          return;
        }

        const ordersRes = await fetch(`${API_BASE_URL}/api/orders/my-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (isMounted && Array.isArray(ordersData)) {
            setOrders(ordersData);
          }
        }
      } catch (error) {
        console.error("Account fetch error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [token, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/cancel/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Order cancelled successfully ✓", "success");
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        showToast(data.message || "Failed to cancel order", "error");
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New password and confirm password do not match!", "error");
      return;
    }

    if (!isPasswordStrong) {
      showToast("Please fulfill all strong password requirements", "error");
      return;
    }

    setPassLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Password updated successfully! 🔒", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.message || "Failed to update password", "error");
      }
    } catch {
      showToast("Server error. Please try again.", "error");
    } finally {
      setPassLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = ORDER_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const currentUser = profile || user;

  const totalSpent = orders.reduce(
    (sum, o) => sum + Number(o.total_amount || 0),
    0
  );
  const activeOrdersCount = orders.filter((o) => o.status !== "Delivered").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
          <p className="mt-4 text-sm font-semibold text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white py-12 px-5">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Ring */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 p-1 shadow-lg shrink-0">
                <div className="w-full h-full bg-gray-900 rounded-[14px] flex items-center justify-center text-white font-black text-2xl">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 text-orange-400 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                  Verified Member
                </div>
                <h1 className="text-2xl md:text-4xl font-black">{currentUser?.name || "Valued Customer"}</h1>
                <p className="text-gray-400 text-xs md:text-sm mt-0.5 flex items-center gap-2">
                  <Mail size={14} className="text-orange-400" />
                  {currentUser?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 border border-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition backdrop-blur-sm"
            >
              <LogOut size={16} />
              Logout Account
            </button>
          </div>
        </section>

        {/* Profile Content Main */}
        <main className="max-w-6xl mx-auto px-5 -mt-6 mb-16">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{orders.length}</h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
                <Package size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Deliveries</p>
                <h3 className="text-2xl font-black text-blue-600 mt-1">{activeOrdersCount}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <PackageCheck size={24} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount Spent</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">${totalSpent.toFixed(2)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 mb-8 gap-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-4 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "orders"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <PackageCheck size={18} />
              Order History & Tracking ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab("password")}
              className={`pb-4 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "password"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <KeyRound size={18} />
              Security & Password
            </button>

            <button
              onClick={() => setActiveTab("details")}
              className={`pb-4 text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
                activeTab === "details"
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              <UserRound size={18} />
              Personal Profile Details
            </button>
          </div>

          {/* TAB 1: ORDER HISTORY & TRACKING */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border shadow-sm max-w-md mx-auto">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">No Orders Placed Yet</h3>
                  <p className="text-gray-500 text-xs mt-1">Explore our product catalog and start shopping!</p>
                  <Link
                    to="/products"
                    className="inline-block mt-6 bg-black text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-orange-500 transition shadow-lg"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const currentStep = getStepIndex(order.status);

                    return (
                      <div
                        key={order.id}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-sm space-y-5 transition hover:border-gray-200"
                      >
                        <div className="flex justify-between items-start border-b pb-4 gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-gray-900 text-lg">Order #{order.id}</span>
                              <span
                                className={`text-[11px] font-bold px-3 py-0.5 rounded-full border uppercase tracking-wider ${
                                  order.status === "Pending"
                                    ? "bg-amber-50 text-amber-600 border-amber-200"
                                    : order.status === "Processing"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : order.status === "Shipped"
                                    ? "bg-purple-50 text-purple-600 border-purple-200"
                                    : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                }`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                              <Calendar size={13} />
                              Placed on {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right flex flex-col items-end gap-2">
                            <span className="font-black text-orange-500 text-xl block">
                              ${Number(order.total_amount).toFixed(2)}
                            </span>

                            {/* Cancel button — strictly for Pending status */}
                            {order.status === "Pending" && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={cancellingId === order.id}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 px-4 py-1.5 rounded-full transition disabled:opacity-50"
                              >
                                <XCircle size={14} />
                                {cancellingId === order.id ? "Cancelling..." : "Cancel Order"}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Order Address info if available */}
                        {order.address && (
                          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                            <div className="flex items-center gap-2 text-gray-900 font-bold mb-1">
                              <MapPin size={14} className="text-orange-500" />
                              Delivery Destination:
                            </div>
                            <p className="pl-5">
                              <span className="font-medium text-gray-800">{order.address}</span>, {order.city},{" "}
                              {order.country}
                            </p>
                            {order.mobile_number && (
                              <p className="pl-5 text-gray-500">
                                Contact Phone: <span className="font-semibold text-gray-800">{order.mobile_number}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Live Step Progress Bar */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                            Delivery Step Tracker
                          </p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {ORDER_STEPS.map((step, idx) => {
                              const isPassed = idx <= currentStep;
                              return (
                                <div key={step} className="flex flex-col items-center">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition mb-1.5 ${
                                      isPassed
                                        ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                                        : "bg-gray-100 text-gray-400"
                                    }`}
                                  >
                                    {isPassed ? <CheckCircle2 size={16} /> : idx + 1}
                                  </div>
                                  <span className={`text-xs font-bold ${isPassed ? "text-gray-900" : "text-gray-400"}`}>
                                    {step}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 max-w-xl mx-auto">
              <div className="flex items-center gap-3 border-b pb-4 mb-6">
                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                  <Lock size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Change Account Password</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Keep your account secure with a strong password.</p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    New Strong Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </div>

                {/* Live Password Strength Requirements Card */}
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    {isPasswordStrong ? (
                      <ShieldCheck size={16} className="text-emerald-500" />
                    ) : (
                      <ShieldAlert size={16} className="text-amber-500" />
                    )}
                    Password Strength Checklist
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-2 ${reqMinLength ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${reqMinLength ? "bg-emerald-500" : "bg-gray-300"}`} />
                      At least 8 characters
                    </div>

                    <div className={`flex items-center gap-2 ${reqUpper ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${reqUpper ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Uppercase letter (A-Z)
                    </div>

                    <div className={`flex items-center gap-2 ${reqLower ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${reqLower ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Lowercase letter (a-z)
                    </div>

                    <div className={`flex items-center gap-2 ${reqNumber ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${reqNumber ? "bg-emerald-500" : "bg-gray-300"}`} />
                      At least one number (0-9)
                    </div>

                    <div className={`flex items-center gap-2 col-span-1 sm:col-span-2 ${reqSpecial ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-2 h-2 rounded-full ${reqSpecial ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Special character (!@#$%^&* etc.)
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full bg-black text-white font-bold py-4 rounded-full text-sm hover:bg-orange-500 transition shadow-lg disabled:opacity-50"
                >
                  {passLoading ? "Updating Password..." : "Update Password Now"}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PERSONAL PROFILE DETAILS */}
          {activeTab === "details" && (
            <div className="bg-white rounded-3xl border shadow-sm p-6 md:p-8 max-w-xl mx-auto space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                  <UserRound size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Your registered account information</p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{currentUser?.name}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-base font-bold text-gray-900 mt-1">{currentUser?.email}</p>
                </div>

                {profile?.created_at && (
                  <div className="bg-gray-50 p-4 rounded-2xl border">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Since</p>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      {new Date(profile.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}