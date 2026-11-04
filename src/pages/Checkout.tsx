import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, ShoppingBag, ShieldCheck, Truck, CreditCard, Banknote, Lock, CheckCircle2, Printer } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import OrderInvoiceModal from "../components/OrderInvoiceModal";
import CouponBox from "../components/CouponBox";
import EmailNotice from "../components/EmailNotice";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";
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

interface CardPaymentConfig {
  enabled: boolean;
  testMode: boolean;
}

function Checkout() {
  const { items, subtotal, discount, shipping, total, coupon, clearCart } = useCart();
  const { currentCurrency, formatPrice } = useCurrency();
  const { user, token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Pre-filled from the saved profile; refreshed from the API below.
  const [address, setAddress] = useState(user?.address || "");
  const [mobileNumber, setMobileNumber] = useState(user?.phone || "");
  const [city, setCity] = useState(user?.city || "");
  const [country, setCountry] = useState(user?.country || "Pakistan");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState<{
    id: number;
    total: string;
    subtotal?: string;
    shippingFee?: string;
    discount?: string;
    couponCode?: string | null;
    address: string;
    mobile: string;
    payment: string;
    paymentStatus?: string;
    transactionId?: string;
    /** Where the API is sending the order confirmation. */
    confirmationEmail?: string | null;
    items?: Array<{
      name: string;
      quantity: number;
      price: number;
      color?: string;
      image?: string;
    }>;
  } | null>(null);

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Card payments go through Stripe Checkout; the API says whether they're switched on.
  const [cardPayments, setCardPayments] = useState<CardPaymentConfig | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      navigate("/login", { replace: true, state: { from: "/checkout" } });
    }
  }, [isAuthenticated, token, navigate]);


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
          }
        })
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/payments/config`)
      .then((res) => res.json())
      .then((data) => setCardPayments(data.card ?? { enabled: false, testMode: true }))
      .catch(() => setCardPayments({ enabled: false, testMode: true }));
  }, []);

  // The server recalculates prices, stock, coupon and shipping from this; it never trusts totals.
  const orderPayload = () => ({
    items: items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      color: item.selectedColor || item.product.colors?.[0]?.name || "Standard",
      color_image: item.selectedColorImage || item.product.image || null,
    })),
    address: address.trim(),
    mobile_number: mobileNumber.trim(),
    city: city.trim(),
    country: country.trim(),
    coupon_code: coupon && subtotal >= coupon.minOrder ? coupon.code : null,
  });

  const readableError = (caught: unknown, fallback: string) => {
    const message = caught instanceof Error ? caught.message : "";
    return message === "Failed to fetch"
      ? "Can't reach the server. Make sure the backend is running, then try again."
      : message || fallback;
  };

  /** Creates the order and sends the shopper to Stripe's hosted payment page. */
  const startCardPayment = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderPayload()),
      });
      const data = await response.json();
      if (response.status === 401) throw new Error("Your session has expired. Please sign in again to pay.");
      if (!response.ok || !data.url) throw new Error(data.message || "Couldn't open the card payment page.");
      // Leave loading on: the browser is about to leave for Stripe. The cart is cleared on
      // /checkout/result once the payment is confirmed.
      window.location.assign(data.url);
    } catch (caught) {
      setError(readableError(caught, "Couldn't open the card payment page."));
      setLoading(false);
    }
  };

  // Cash on delivery: the order is placed straight away.
  const executeOrderPlacement = async () => {
    try {
      setLoading(true);
      setError("");

      const payload = { ...orderPayload(), payment_method: "cod" };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401) {
        throw new Error("Your session has expired. Please sign in again to place the order.");
      }
      if (!response.ok) {
        throw new Error(data.message || "Failed to process order.");
      }

      setOrderSuccess({
        id: data.orderId,
        total: data.total_amount || total.toFixed(2),
        subtotal: data.subtotal,
        shippingFee: data.shipping_fee,
        discount: data.discount_amount,
        couponCode: data.coupon_code,
        address: `${address.trim()}, ${city.trim()}, ${country.trim()}`,
        mobile: mobileNumber.trim(),
        payment: data.payment_method || "Cash on Delivery (COD)",
        paymentStatus: data.payment_status || "Pending",
        transactionId: data.transaction_id || null,
        confirmationEmail: data.confirmation_email || null,
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
    } catch (caught) {
      console.error("Checkout page error:", caught);
      setError(readableError(caught, "An error occurred while placing your order."));
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

    if (paymentMethod === "card") {
      if (!cardPayments?.enabled) {
        setError("Card payments aren't available right now. Choose cash on delivery.");
        return;
      }
      await startCardPayment();
      return;
    }

    await executeOrderPlacement();
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

          {orderSuccess.confirmationEmail && (
            <EmailNotice className="mx-auto mt-6 max-w-lg">
              A confirmation email is on its way to <strong>{orderSuccess.confirmationEmail}</strong>. We'll email you again
              when your order ships.
            </EmailNotice>
          )}

          <div className="bg-gray-50 rounded-3xl p-6 md:p-8 mt-8 border text-left space-y-4 max-w-lg mx-auto">
            <h3 className="font-bold text-lg border-b pb-3 text-gray-900">
              Order Confirmation Details
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Order Reference</span>
              <span className="font-bold text-gray-900">#{orderSuccess.id}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                {orderSuccess.paymentStatus === "Paid" ? "Total Paid" : "Total Due on Delivery"}
              </span>
              <span className="text-right">
                <span className="font-bold text-lg text-orange-500 block">
                  {formatPrice(Number(orderSuccess.total))}
                </span>
                {currentCurrency.code !== "USD" && (
                  <span className="text-[11px] text-gray-400">${orderSuccess.total} USD</span>
                )}
              </span>
            </div>

            {Number(orderSuccess.discount) > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Coupon {orderSuccess.couponCode}</span>
                <span className="font-bold text-emerald-600">−{formatPrice(Number(orderSuccess.discount))}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="font-bold text-gray-800">
                {Number(orderSuccess.shippingFee) > 0 ? formatPrice(Number(orderSuccess.shippingFee)) : "FREE"}
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
                            src={getImageUrl(it.image)}
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
                        {formatPrice(it.price * it.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link
              to={`/track-order?orderId=${orderSuccess.id}&email=${encodeURIComponent(user?.email || "")}`}
              className="border border-gray-300 bg-white px-8 py-4 rounded-full hover:bg-gray-100 transition font-semibold"
            >
              Track this order
            </Link>
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
              subtotal: orderSuccess.subtotal,
              shipping_fee: orderSuccess.shippingFee,
              discount_amount: orderSuccess.discount,
              coupon_code: orderSuccess.couponCode,
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "cod"}
                      onClick={() => setPaymentMethod("cod")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition ${
                        paymentMethod === "cod"
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Banknote size={22} />
                      <span className="text-xs">Cash on Delivery</span>
                    </button>

                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === "card"}
                      disabled={cardPayments !== null && !cardPayments.enabled}
                      onClick={() => setPaymentMethod("card")}
                      className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        paymentMethod === "card"
                          ? "border-orange-500 bg-orange-50 text-orange-600 font-bold"
                          : "border-gray-200 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <CreditCard size={22} />
                      <span className="text-xs">Card (secure payment by Stripe)</span>
                    </button>
                  </div>

                  {cardPayments !== null && !cardPayments.enabled && (
                    <p className="mt-3 text-xs text-gray-500">Card payments aren't set up on this store yet, so orders are cash on delivery.</p>
                  )}

                  {/* CARD PANEL: the card is entered on Stripe's hosted page, never here */}
                  {paymentMethod === "card" && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3 text-xs text-gray-600">
                      <Lock size={20} className="text-orange-500 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <h5 className="font-bold text-gray-900">You'll pay on Stripe's secure page</h5>
                        <p className="leading-relaxed">
                          When you continue, we hold your items for 30 minutes and take you to Stripe to pay{" "}
                          <strong className="text-gray-900">${total.toFixed(2)} USD</strong>. NOVA never sees or stores your card number.
                          If you leave without paying, nothing is charged and the items go back on sale.
                        </p>
                        {cardPayments?.testMode && (
                          <p className="leading-relaxed text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            <strong>Test mode:</strong> nothing is charged. Use card{" "}
                            <span className="font-mono">4242 4242 4242 4242</span> with any future date and any CVC, or{" "}
                            <span className="font-mono">4000 0000 0000 0002</span> to see a declined payment.
                          </p>
                        )}
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
                            src={getImageUrl(item.selectedColorImage || item.product.image, item.product.category)}
                            onError={imageFallbackHandler(item.product.category)}
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
                              Qty: {item.quantity} × {formatPrice(item.product.price)}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <CouponBox />
                  </div>

                  <div className="border-t pt-4 space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount ({coupon?.code})</span>
                        <span className="font-semibold">−{formatPrice(discount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-600">
                      <span>Shipping Fee</span>
                      <span className="font-semibold text-gray-900">
                        {shipping === 0 ? "FREE" : formatPrice(shipping)}
                      </span>
                    </div>

                    <div className="border-t pt-3 flex justify-between text-xl font-black">
                      <span>Total Amount</span>
                      <span className="text-orange-500">{formatPrice(total)}</span>
                    </div>
                    {currentCurrency.code !== "USD" && (
                      <p className="text-[11px] text-gray-400 text-right">Charged as ${total.toFixed(2)} USD</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-4 rounded-full mt-6 hover:bg-orange-500 transition font-bold text-base shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        {paymentMethod === "card" ? "Opening secure payment…" : "Placing your order…"}
                      </>
                    ) : paymentMethod === "card" ? (
                      `Continue to payment (${formatPrice(total)})`
                    ) : (
                      `Place Cash on Delivery Order (${formatPrice(total)})`
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
