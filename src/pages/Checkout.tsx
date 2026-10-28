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
  Lock,
  Smartphone,
  CheckCircle2,
  X,
  Sparkles,
  Printer,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderInvoiceModal from "../components/OrderInvoiceModal";

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
    paymentStatus?: string;
    transactionId?: string;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
      color?: string;
      image?: string;
    }>;
  } | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Card Payment Form States
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Mobile Wallet States (JazzCash / EasyPaisa)
  const [walletProvider, setWalletProvider] = useState<"JazzCash" | "EasyPaisa">("JazzCash");
  const [walletMobile, setWalletMobile] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(59);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login");
    }
  }, [isAuthenticated, token, navigate]);

  // Auto-fill shipping address & phone from saved user profile
  useEffect(() => {
    if (user) {
      if (user.address && !address) setAddress(user.address);
      if (user.phone && !mobileNumber) setMobileNumber(user.phone);
      if (user.city && !city) setCity(user.city);
      if (user.country && country === "Pakistan") setCountry(user.country);
      if (user.name && !cardHolder) setCardHolder(user.name);
    }
  }, [user]);

  useEffect(() => {
    if (mobileNumber && !walletMobile) {
      setWalletMobile(mobileNumber);
    }
  }, [mobileNumber]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            if (data.user.address) setAddress((prev) => prev || data.user.address);
            if (data.user.phone) setMobileNumber((prev) => prev || data.user.phone);
            if (data.user.city) setCity((prev) => prev || data.user.city);
            if (data.user.country) setCountry((prev) => (prev === "Pakistan" && data.user.country ? data.user.country : prev));
            if (data.user.name) setCardHolder((prev) => prev || data.user.name);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // OTP Countdown Timer
  useEffect(() => {
    let timer: any;
    if (showOtpModal && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, otpCountdown]);

  // Card helpers
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
    if (/^(34|37)/.test(clean)) return "Amex";
    return "Card";
  };

  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const handleExpiryInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length <= 2) {
      setCardExpiry(raw);
    } else {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    }
  };

  const handleCvcInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardCvc(raw);
  };

  // Execution function for placing orders in database
  const executeOrderPlacement = async (selectedMethod: string, paymentDetails?: any) => {
    try {
      setLoading(true);
      setError("");

      const payload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          color: item.selectedColor || (item.product.colors?.[0]?.name) || "Standard",
          color_image: item.selectedColorImage || item.product.image || null,
        })),
        address: address.trim(),
        mobile_number: mobileNumber.trim(),
        city: city.trim(),
        country: country.trim(),
        payment_method: selectedMethod,
        payment_details: paymentDetails || null,
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
        payment: data.payment_method || (
          selectedMethod === "cod"
            ? "Cash on Delivery (COD)"
            : selectedMethod === "card"
            ? `Credit / Debit Card (${paymentDetails?.cardBrand || "Card"})`
            : `Mobile Wallet (${paymentDetails?.walletProvider || "JazzCash / EasyPaisa"})`
        ),
        paymentStatus: data.payment_status || (selectedMethod === "cod" ? "Pending" : "Paid"),
        transactionId: data.transaction_id || paymentDetails?.transactionId || null,
        items: items.map((it) => ({
          name: it.product.name,
          quantity: it.quantity,
          price: it.product.price,
          color: it.selectedColor || undefined,
          image: it.selectedColorImage || it.product.image,
        })),
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

    // Validation for Credit / Debit Card
    if (paymentMethod === "card") {
      if (!cardHolder.trim()) {
        setError("Please enter the cardholder's full name.");
        return;
      }
      const rawNum = cardNumber.replace(/\D/g, "");
      if (rawNum.length !== 16) {
        setError("Please enter a valid 16-digit card number.");
        return;
      }
      if (cardExpiry.length !== 5) {
        setError("Please enter a valid card expiry date (MM/YY).");
        return;
      }
      const [expMonth] = cardExpiry.split("/").map(Number);
      if (!expMonth || expMonth < 1 || expMonth > 12) {
        setError("Invalid expiry month on card (01 to 12).");
        return;
      }
      if (cardCvc.length < 3) {
        setError("Please enter a valid 3 or 4 digit CVV/CVC.");
        return;
      }

      await executeOrderPlacement("card", {
        cardBrand: getCardBrand(cardNumber),
        cardHolder: cardHolder.trim(),
        transactionId: `TXN-CARD-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      return;
    }

    // Validation for Mobile Wallet (JazzCash / EasyPaisa)
    if (paymentMethod === "wallet") {
      const cleanWallet = walletMobile.replace(/\D/g, "");
      if (cleanWallet.length !== 11 || !cleanWallet.startsWith("03")) {
        setError(`Please enter a valid 11-digit ${walletProvider} mobile number starting with 03 (e.g. 03001234567).`);
        return;
      }

      // Open interactive MPIN / OTP authorization modal
      setError("");
      setOtpValue("");
      setOtpError("");
      setOtpCountdown(59);
      setShowOtpModal(true);
      return;
    }

    // Cash on Delivery
    await executeOrderPlacement("cod", null);
  };

  const handleVerifyOtpAndPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.trim().length !== 4) {
      setOtpError("Please enter your 4-digit approval MPIN / OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    setTimeout(async () => {
      setIsVerifyingOtp(false);
      setShowOtpModal(false);
      await executeOrderPlacement("wallet", {
        walletProvider,
        walletMobile: walletMobile.trim(),
        transactionId: `TXN-${walletProvider.toUpperCase().slice(0, 4)}-${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }, 1200);
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

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Payment Status</span>
              {orderSuccess.paymentStatus === "Paid" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <CheckCircle2 size={14} /> Paid Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  Pending upon Delivery
                </span>
              )}
            </div>

            {orderSuccess.transactionId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="font-mono text-xs font-bold text-gray-700 bg-gray-200/60 px-2.5 py-1 rounded-lg">
                  {orderSuccess.transactionId}
                </span>
              </div>
            )}

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

            {/* Ordered Items with Colors */}
            {orderSuccess.items && orderSuccess.items.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">
                  Items Ordered
                </span>
                <div className="space-y-2">
                  {orderSuccess.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        {it.image && (
                          <img
                            src={it.image}
                            alt={it.name}
                            className="w-9 h-9 object-cover rounded-lg border bg-gray-50 shrink-0"
                          />
                        )}
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{it.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {it.color ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                                Color: {it.color}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400">Standard</span>
                            )}
                            <span className="text-gray-400">({it.quantity}x)</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">
                        ${(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-orange-500 text-white px-8 py-4 rounded-full hover:bg-orange-600 transition font-semibold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              <Printer size={18} />
              Print Official Invoice
            </button>
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

        {/* PRINTABLE INVOICE MODAL */}
        {showInvoiceModal && (
          <OrderInvoiceModal
            order={{
              id: orderSuccess.id,
              total_amount: orderSuccess.total,
              status: orderSuccess.paymentStatus === "Paid" ? "Processing" : "Pending",
              payment_method: orderSuccess.payment,
              payment_status: orderSuccess.paymentStatus,
              transaction_id: orderSuccess.transactionId,
              customer_name: user?.name,
              customer_email: user?.email,
              address: orderSuccess.address,
              mobile_number: orderSuccess.mobile,
              city: city || user?.city || undefined,
              country: country || user?.country || undefined,
              items: orderSuccess.items?.map((it, idx) => ({
                id: idx + 1,
                product_name: it.name,
                quantity: it.quantity,
                price: it.price,
                color: it.color,
                product_image: it.image,
              })),
            }}
            onClose={() => setShowInvoiceModal(false)}
          />
        )}

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
                <div className="border-b pb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Shipping & Contact Information
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {address ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                          <CheckCircle size={15} /> Pre-filled from your saved default address
                        </span>
                      ) : (
                        "Complete your shipping address and contact details below."
                      )}
                    </p>
                  </div>
                  <Link
                    to="/account"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full transition"
                  >
                    Edit Saved Address
                  </Link>
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

                  {/* 1. CREDIT / DEBIT CARD PANEL */}
                  {paymentMethod === "card" && (
                    <div className="mt-5 p-5 bg-gradient-to-br from-gray-50 to-gray-100/70 border border-gray-200 rounded-2xl space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard size={18} className="text-orange-500" />
                          <h4 className="font-bold text-sm text-gray-900">Card Payment Details</h4>
                        </div>
                        <span className="text-[11px] font-bold text-gray-500 bg-white border px-2.5 py-0.5 rounded-full">
                          {getCardBrand(cardNumber)} Secure 256-Bit SSL
                        </span>
                      </div>

                      {/* Visual Mock Credit Card Widget */}
                      <div className="relative w-full max-w-sm mx-auto h-44 rounded-2xl bg-gradient-to-tr from-neutral-900 via-gray-800 to-stone-900 text-white p-5 shadow-xl flex flex-col justify-between overflow-hidden border border-white/10">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="flex justify-between items-start z-10">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-200/40 shadow-inner flex items-center justify-center">
                              <div className="w-5 h-3 border border-amber-600/50 rounded-sm" />
                            </div>
                            <span className="text-[10px] tracking-widest uppercase text-gray-300 font-bold">
                              NOVA PAY
                            </span>
                          </div>
                          <span className="text-sm font-black italic tracking-wider text-orange-400">
                            {getCardBrand(cardNumber)}
                          </span>
                        </div>

                        <div className="z-10">
                          <p className="font-mono text-lg tracking-widest text-white/90 drop-shadow">
                            {cardNumber || "•••• •••• •••• ••••"}
                          </p>
                        </div>

                        <div className="flex justify-between items-end z-10 text-xs">
                          <div>
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Cardholder</p>
                            <p className="font-bold tracking-wide uppercase truncate max-w-[170px]">
                              {cardHolder || "YOUR NAME"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Expires</p>
                            <p className="font-bold font-mono">{cardExpiry || "MM/YY"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card Input Fields */}
                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Name on Card
                          </label>
                          <input
                            type="text"
                            placeholder="Full name as printed on card"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                            Card Number (16 Digits)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="0000 0000 0000 0000"
                              value={cardNumber}
                              onChange={handleCardNumberInput}
                              maxLength={19}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 font-mono transition pr-20"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                              {getCardBrand(cardNumber)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={handleExpiryInput}
                              maxLength={5}
                              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 font-mono transition text-center"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                              CVV / CVC
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                placeholder="3 or 4 digits"
                                value={cardCvc}
                                onChange={handleCvcInput}
                                maxLength={4}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 font-mono transition text-center pr-8"
                              />
                              <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. MOBILE WALLET PANEL (JazzCash / EasyPaisa) */}
                  {paymentMethod === "wallet" && (
                    <div className="mt-5 p-5 bg-gradient-to-br from-orange-50/60 to-amber-50/40 border border-orange-200 rounded-2xl space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b border-orange-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <Smartphone size={18} className="text-orange-600" />
                          <h4 className="font-bold text-sm text-gray-900">Mobile Wallet Payment</h4>
                        </div>
                        <span className="text-[11px] font-bold text-orange-700 bg-white border border-orange-200 px-2.5 py-0.5 rounded-full">
                          Instant MPIN / OTP
                        </span>
                      </div>

                      {/* Wallet Provider Selector */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                          Choose Mobile Wallet Provider
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setWalletProvider("JazzCash")}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                              walletProvider === "JazzCash"
                                ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-500/20"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            JazzCash
                          </button>

                          <button
                            type="button"
                            onClick={() => setWalletProvider("EasyPaisa")}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                              walletProvider === "EasyPaisa"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            <span className="w-2.5 h-2.5 rounded-full bg-white" />
                            EasyPaisa
                          </button>
                        </div>
                      </div>

                      {/* Wallet Mobile Number */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          {walletProvider} Mobile Account Number
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            placeholder="03001234567"
                            value={walletMobile}
                            onChange={(e) => setWalletMobile(e.target.value)}
                            maxLength={11}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 font-mono transition"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                            11 Digits
                          </span>
                        </div>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-orange-200/80 text-xs text-gray-600 flex items-start gap-2.5">
                        <Sparkles size={16} className="text-orange-500 shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          When you click authorize, an approval prompt with an MPIN/OTP will be verified on your <strong className="text-gray-900">{walletProvider}</strong> mobile account.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. CASH ON DELIVERY PANEL */}
                  {paymentMethod === "cod" && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-xs text-gray-600">
                      <Banknote size={20} className="text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-gray-900 mb-0.5">Pay with Cash on Doorstep</h5>
                        <p className="leading-relaxed">
                          Pay with exact cash directly to the courier agent when your parcel is delivered. No online prepayment required.
                        </p>
                      </div>
                    </div>
                  )}
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
                        key={`${item.product.id}-${item.selectedColor || "default"}`}
                        className="py-3 flex gap-3 items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.selectedColorImage || item.product.image}
                            alt={item.product.name}
                            className="w-14 h-14 object-cover rounded-xl bg-gray-100 border shrink-0"
                          />
                          <div>
                            <h4 className="font-semibold text-sm line-clamp-1">
                              {item.product.name}
                            </h4>
                            {item.selectedColor && (
                              <p className="text-[11px] font-bold text-orange-600">
                                Color: {item.selectedColor}
                              </p>
                            )}
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
                        Processing Payment...
                      </>
                    ) : paymentMethod === "card" ? (
                      `Pay $${total.toFixed(2)} with Card`
                    ) : paymentMethod === "wallet" ? (
                      `Authorize $${total.toFixed(2)} via ${walletProvider}`
                    ) : (
                      `Place Cash on Delivery Order ($${total.toFixed(2)})`
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

      {/* MOBILE WALLET OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6 relative animate-scaleUp">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtpError("");
              }}
              className="absolute right-5 top-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>

            <div className="text-center space-y-2">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg ${
                  walletProvider === "JazzCash"
                    ? "bg-red-600 shadow-red-500/30"
                    : "bg-emerald-600 shadow-emerald-500/30"
                }`}
              >
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 pt-2">
                {walletProvider} Authorization
              </h3>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">
                Enter your 4-digit mobile transaction MPIN / OTP to authorize payment of{" "}
                <strong className="text-gray-900">${total.toFixed(2)}</strong> on account{" "}
                <span className="font-mono font-bold text-gray-800">{walletMobile}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpAndPay} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider text-center mb-2">
                  Enter 4-Digit MPIN / OTP
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={otpValue}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setOtpValue(clean);
                    if (otpError) setOtpError("");
                  }}
                  autoFocus
                  className="w-44 mx-auto block text-center text-3xl tracking-[0.4em] font-mono py-3 border-2 border-gray-300 rounded-2xl outline-none focus:border-orange-500 transition bg-gray-50"
                />
                {otpError && (
                  <p className="text-xs text-red-600 font-bold text-center mt-2 animate-shake">
                    {otpError}
                  </p>
                )}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 px-2">
                <span>Code expires in:</span>
                <span className="font-mono font-bold text-orange-600">
                  00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
                <Lock size={13} className="text-emerald-600" />
                <span>Encrypted 3D-Secure mobile gateway</span>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpValue.length !== 4}
                className="w-full bg-black text-white font-bold py-3.5 rounded-full text-sm hover:bg-orange-500 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying with {walletProvider}...</span>
                  </>
                ) : (
                  `Authorize & Pay $${total.toFixed(2)}`
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpCountdown(59);
                  showToast("New OTP sent to mobile account! 📲", "info");
                }}
                disabled={otpCountdown > 0}
                className="w-full text-xs text-center text-gray-500 hover:text-orange-600 font-semibold disabled:opacity-40"
              >
                Didn't receive code? Resend MPIN
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Checkout;
