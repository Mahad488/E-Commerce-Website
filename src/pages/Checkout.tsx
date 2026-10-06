import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  ShoppingBag,
  ShieldCheck,
  Truck,
  CreditCard,
  Banknote,
  Wallet,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config/api";

const COUNTRIES = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Turkey",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "China",
  "India",
  "Japan",
  "South Korea",
  "Brazil",
  "South Africa",
  "Egypt",
  "Malaysia",
  "Singapore",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Other",
];

function Checkout() {
  const { items, subtotal, shipping, total, clearCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Pakistan");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    id: number;
    total: string;
    address: string;
    mobile: string;
    payment: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.trim() || !mobileNumber.trim() || !city.trim() || !country.trim()) {
      setError("Please complete all required shipping fields.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        address: address.trim(),
        mobile_number: mobileNumber.trim(),
        city: city.trim(),
        country: country.trim(),
        payment_method: paymentMethod,
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process order.");
      }

      setOrderSuccess({
        id: data.orderId,
        total: data.total_amount || total.toFixed(2),
        address: `${address.trim()}, ${city.trim()}, ${country.trim()}`,
        mobile: mobileNumber.trim(),
        payment:
          paymentMethod === "cod"
            ? "Cash on Delivery (COD)"
            : paymentMethod === "card"
            ? "Credit / Debit Card"
            : "Mobile Wallet (JazzCash / EasyPaisa)",
      });

      clearCart();
      showToast("Order placed successfully! 🎉", "success");
    } catch (err: any) {
      console.error("Checkout page error:", err);
      setError(err.message || "An error occurred while placing your order.");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />

        <div className="max-w-3xl mx-auto px-5 py-20 text-center">
          <div className="bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white shadow-xl">
            <CheckCircle size={52} />
          </div>

          <h1 className="text-4xl font-black text-gray-900 mt-8">
            Thank You For Your Order! 🎉
          </h1>

          <p className="text-gray-600 mt-3 text-lg">
            Your order <span className="font-bold text-black">#{orderSuccess.id}</span> has been placed successfully and is being processed.
          </p>

          <div className="bg-gray-50 rounded-3xl p-6 md:p-8 mt-8 border text-left space-y-4 max-w-lg mx-auto">
            <h3 className="font-bold text-lg border-b pb-3 text-gray-900">
              Order Confirmation Details
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Order Reference</span>
              <span className="font-bold text-gray-900">#{orderSuccess.id}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Total Amount Paid</span>
              <span className="font-bold text-lg text-orange-500">
                ${orderSuccess.total}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Payment Option</span>
              <span className="font-bold text-gray-800">{orderSuccess.payment}</span>
            </div>

            <div className="text-sm">
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1 font-semibold">
                Delivery Address
              </span>
              <span className="font-medium text-gray-800">
                {orderSuccess.address}
              </span>
            </div>

            <div className="text-sm">
              <span className="text-gray-500 block text-xs uppercase tracking-wider mb-1 font-semibold">
                Contact Phone
              </span>
              <span className="font-medium text-gray-800">
                {orderSuccess.mobile}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              to="/account"
              className="bg-black text-white px-8 py-4 rounded-full hover:bg-orange-500 transition font-semibold"
            >
              View Orders in Account
            </Link>
            <Link
              to="/products"
              className="border border-gray-300 bg-white px-8 py-4 rounded-full hover:bg-gray-100 transition font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-[#f5f2ed] py-10 border-b">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-500 mb-4 transition font-medium"
          >
            <ArrowLeft size={16} />
            Back to Cart
          </Link>
          <h1 className="text-4xl font-black text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Complete your shipping address and payment option.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border">
            <ShoppingBag size={48} className="mx-auto text-gray-300" />
            <h2 className="text-2xl font-bold mt-4">Your Cart is Empty</h2>
            <p className="text-gray-500 mt-2">
              Add some products before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="inline-block mt-6 bg-black text-white px-8 py-3.5 rounded-full hover:bg-orange-500 transition font-semibold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder}>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10">
              {/* Shipping & Payment Form */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm space-y-6">
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Shipping & Contact Information
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Your account details are pre-filled automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                      Full Name (Auto-filled)
                    </label>
                    <input
                      type="text"
                      value={user?.name || ""}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-600 font-medium cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                      Email Address (Auto-filled)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-600 font-medium cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                    Mobile / Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-orange-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                    Street / Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="House number, Street name, Area, Apartment / Suite details"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-orange-500 transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lahore, Karachi, London"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 text-xs uppercase tracking-wider">
                      Country / Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-orange-500 transition bg-white"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Selection Options */}
                <div className="pt-4 border-t">
                  <h3 className="font-bold text-lg text-gray-900 mb-3">
                    Payment Method
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition ${
                        paymentMethod === "cod"
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Banknote size={22} />
                      <span className="text-xs">Cash on Delivery</span>
                    </label>

                    <label
                      onClick={() => setPaymentMethod("card")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition ${
                        paymentMethod === "card"
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <CreditCard size={22} />
                      <span className="text-xs">Credit / Debit Card</span>
                    </label>

                    <label
                      onClick={() => setPaymentMethod("wallet")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition ${
                        paymentMethod === "wallet"
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Wallet size={22} />
                      <span className="text-xs">JazzCash / Wallet</span>
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="pt-4 border-t flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={18} className="text-green-600" />
                    Secure Encrypted Order
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck size={18} className="text-orange-500" />
                    Fast Express Delivery
                  </div>
                </div>
              </div>

              {/* Order Items & Price Summary Sidebar */}
              <aside className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-3xl border shadow-sm">
                  <h2 className="text-xl font-bold mb-5 text-gray-900 border-b pb-3">
                    Order Summary ({items.length} items)
                  </h2>

                  <div className="divide-y max-h-72 overflow-y-auto pr-1 mb-5">
                    {items.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-3 flex gap-3 items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-xl bg-gray-100 border"
                          />
                          <div>
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-sm">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Fee</span>
                      <span className="font-semibold text-gray-900">
                        {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="border-t pt-3 flex justify-between text-xl font-black">
                      <span>Total Amount</span>
                      <span className="text-orange-500">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-full mt-6 hover:bg-orange-500 transition font-bold text-base shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Processing Order...
                      </>
                    ) : (
                      "Complete & Place Order"
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500 mt-4">
                    By placing your order, you agree to NOVA terms & policies.
                  </p>
                </div>
              </aside>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Checkout;
