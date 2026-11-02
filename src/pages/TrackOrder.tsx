import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, Clock, MapPin, Package, PackageSearch, Search, Truck, XCircle } from "lucide-react";

import PageShell from "../components/PageShell";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getImageUrl } from "../lib/catalog";

interface TrackedOrder {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: string;
  destination: string;
  placedAt: string;
  updatedAt: string;
  history: { status: string; note?: string | null; created_at: string }[];
  items: { name: string; quantity: number; color?: string; image?: string }[];
}

const STEPS = [
  { status: "Pending", label: "Order placed", icon: Clock },
  { status: "Processing", label: "Processing", icon: Package },
  { status: "Shipped", label: "Shipped", icon: Truck },
  { status: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

interface TrackResult {
  order?: TrackedOrder;
  error?: string;
  query?: URLSearchParams;
}

async function fetchTracking(id: string, mail: string): Promise<TrackResult> {
  const query = new URLSearchParams({ orderId: id.trim().replace(/^#/, ""), email: mail.trim() });
  try {
    const res = await fetch(`${API_BASE_URL}/api/orders/track?${query}`);
    const data = await res.json();
    if (!res.ok) return { error: data.message || "Order not found" };
    return { order: data.order, query };
  } catch {
    return { error: "Can't reach the server right now. Please try again shortly." };
  }
}

export default function TrackOrder() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [orderId, setOrderId] = useState(params.get("orderId") || "");
  const [email, setEmail] = useState(params.get("email") || user?.email || "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(() => Boolean(params.get("orderId") && params.get("email")));
  const [error, setError] = useState("");

  const apply = (result: TrackResult) => {
    if (result.order) {
      setOrder(result.order);
      setError("");
      if (result.query) setParams(result.query, { replace: true });
    } else {
      setOrder(null);
      setError(result.error || "Order not found");
    }
    setLoading(false);
  };

  const lookup = (id: string, mail: string) => {
    if (!id.trim() || !mail.trim()) {
      setError("Enter both your order number and the email you ordered with.");
      return;
    }
    setLoading(true);
    fetchTracking(id, mail).then(apply);
  };

  // Auto-lookup when arriving from a link (e.g. the order confirmation page).
  useEffect(() => {
    const id = params.get("orderId");
    const mail = params.get("email");
    if (id && mail) fetchTracking(id, mail).then(apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelled = order?.status === "Cancelled";
  const currentIndex = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const stepTime = (status: string) => order?.history.find((h) => h.status === status)?.created_at;

  return (
    <PageShell
      eyebrow="Order status"
      title="Track your order"
      subtitle="Enter your order number and the email on your account to see where your package is."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(orderId, email);
        }}
        className="grid sm:grid-cols-[1fr_1.4fr_auto] gap-3 bg-white border rounded-3xl p-4 shadow-sm"
      >
        <label className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 border focus-within:border-orange-500">
          <span className="text-gray-400 font-bold">#</span>
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            inputMode="numeric"
            placeholder="Order number"
            aria-label="Order number"
            className="bg-transparent outline-none w-full text-sm"
          />
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Email address"
          className="bg-gray-50 rounded-2xl px-4 py-3 border outline-none focus:border-orange-500 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-2xl px-6 py-3 font-bold text-sm hover:bg-orange-500 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Search size={16} />
          {loading ? "Looking…" : "Track"}
        </button>
      </form>

      {error && (
        <p className="mt-5 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">{error}</p>
      )}

      {!order && !error && (
        <div className="text-center py-16 text-gray-400">
          <PackageSearch size={48} className="mx-auto" />
          <p className="mt-3 text-sm">
            Your order number is in your confirmation and in{" "}
            <Link to="/account" className="text-orange-600 font-semibold hover:underline">
              your account
            </Link>
            .
          </p>
        </div>
      )}

      {order && (
        <div className="mt-10 space-y-8 animate-fade-in">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Order #{order.id}</p>
              <h2 className="text-3xl font-black mt-1">
                {cancelled ? "Cancelled" : order.status === "Delivered" ? "Delivered 🎉" : order.status}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Placed {formatDate(order.placedAt)}</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-black text-xl">{formatPrice(Number(order.total))}</p>
              <p className="text-gray-500">
                {order.paymentStatus === "Paid" ? "Paid" : "Payment due on delivery"} · {order.paymentMethod}
              </p>
            </div>
          </div>

          {cancelled ? (
            <div className="flex items-center gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
              <XCircle size={22} />
              <p className="text-sm font-semibold">
                This order was cancelled {formatDate(stepTime("Cancelled"))}. Nothing will be shipped.
              </p>
            </div>
          ) : (
            <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-0 relative">
              {STEPS.map((step, index) => {
                const done = index <= currentIndex;
                const current = index === currentIndex;
                const Icon = done ? step.icon : Circle;
                return (
                  <li key={step.status} className="relative flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3">
                    {index < STEPS.length - 1 && (
                      <span
                        className={`hidden sm:block absolute top-6 left-1/2 w-full h-1 rounded-full ${
                          index < currentIndex ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition ${
                        done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-gray-100 text-gray-400"
                      } ${current ? "ring-4 ring-emerald-200 animate-pulse-soft" : ""}`}
                    >
                      <Icon size={20} />
                    </span>
                    <span>
                      <span className={`block text-sm font-bold ${done ? "text-gray-900" : "text-gray-400"}`}>{step.label}</span>
                      <span className="block text-xs text-gray-400 mt-0.5">{formatDate(stepTime(step.status)) || "—"}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="grid md:grid-cols-[1fr_300px] gap-6">
            <div className="border rounded-3xl p-6">
              <h3 className="font-bold mb-4">Items</h3>
              <ul className="divide-y">
                {order.items.map((item, i) => (
                  <li key={i} className="py-3 flex items-center gap-3">
                    <img src={getImageUrl(item.image)} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100" />
                    <span className="flex-1 text-sm">
                      <span className="font-semibold block">{item.name}</span>
                      {item.color && item.color !== "Standard" && <span className="text-gray-500 text-xs">{item.color}</span>}
                    </span>
                    <span className="text-sm text-gray-500">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border rounded-3xl p-6 space-y-5 h-fit">
              <div>
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-orange-500" /> Shipping to
                </h3>
                <p className="text-sm text-gray-600 mt-1">{order.destination || "—"}</p>
              </div>
              <div>
                <h3 className="font-bold text-sm mb-2">Activity</h3>
                <ul className="space-y-2">
                  {[...order.history].reverse().map((h, i) => (
                    <li key={i} className="text-xs text-gray-600 flex justify-between gap-3">
                      <span>
                        <span className="font-semibold text-gray-900">{h.status}</span>
                        {h.note ? ` — ${h.note}` : ""}
                      </span>
                      <span className="text-gray-400 shrink-0">{formatDate(h.created_at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
