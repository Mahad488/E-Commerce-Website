import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgePercent,
  DollarSign,
  Inbox,
  Mail,
  Package,
  RefreshCw,
  ShoppingBag,
  Table2,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";

import { API_BASE_URL } from "../../src/config/api";

interface DayPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalDiscounts: number;
  pendingOrders: number;
  totalProducts: number;
  totalUsers: number;
  subscribers: number;
  unreadMessages: number;
  statusBreakdown: { status: string; count: number }[];
  revenueByDay: DayPoint[];
  topProducts: { id: number; name: string; image: string; category: string; unitsSold: number; revenue: number }[];
  categoryRevenue: { category: string; revenue: number; units: number }[];
  lowStock: { id: number; name: string; image: string; stock: number; category: string }[];
  lowStockThreshold: number;
  recentMessages: { id: number; name: string; email: string; subject: string; message: string; isRead: number; createdAt: string }[];
}

interface AdminAnalyticsProps {
  onGoToProducts?: () => void;
  onGoToOrders?: () => void;
}

const BAR_COLOR = "#ea580c"; // orange-600 — validated ≥3:1 against the light surface
const STATUS_ORDER = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const money = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: n < 1000 ? 2 : 0, maximumFractionDigits: n < 1000 ? 2 : 0 })}`;
const compactMoney = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `$${Math.round(n)}`);

function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/* Revenue column chart (single series, hover tooltip, table toggle)   */
/* ------------------------------------------------------------------ */
function RevenueChart({ data }: { data: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);

  const width = 720;
  const height = 240;
  const pad = { top: 16, right: 12, bottom: 28, left: 52 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const slot = plotW / data.length;
  const barW = Math.min(24, slot * 0.6);
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  const columnPath = (x: number, y: number, w: number, h: number) => {
    if (h <= 0) return "";
    const r = Math.min(4, h, w / 2);
    // Rounded data-end (top), square at the baseline.
    return `M${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} Z`;
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-gray-900">Revenue, last {data.length} days</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {money(total)} from {totalOrders} orders · cancelled orders excluded
          </p>
        </div>
        <button
          onClick={() => setAsTable((v) => !v)}
          className="text-xs font-semibold text-gray-600 border rounded-full px-3 py-1.5 hover:bg-gray-50 flex items-center gap-1.5"
        >
          {asTable ? <BarChart3 size={13} /> : <Table2 size={13} />}
          {asTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {asTable ? (
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 text-left sticky top-0 bg-white">
              <tr>
                <th className="py-2 font-semibold">Date</th>
                <th className="py-2 font-semibold text-right">Orders</th>
                <th className="py-2 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.date}>
                  <td className="py-1.5">{shortDate(d.date)}</td>
                  <td className="py-1.5 text-right tabular-nums">{d.orders}</td>
                  <td className="py-1.5 text-right tabular-nums">{money(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="Daily revenue column chart">
            {ticks.map((t) => {
              const y = pad.top + plotH - (t / max) * plotH;
              return (
                <g key={t}>
                  <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#eceae6" strokeWidth={1} />
                  <text x={pad.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#6b7280">
                    {compactMoney(t)}
                  </text>
                </g>
              );
            })}
            {data.map((d, i) => {
              const h = (d.revenue / max) * plotH;
              const x = pad.left + i * slot + (slot - barW) / 2;
              const y = pad.top + plotH - h;
              const showLabel = data.length <= 14 ? i % 2 === 0 || i === data.length - 1 : i % 4 === 0;
              return (
                <g key={d.date}>
                  {hover === i && (
                    <rect x={pad.left + i * slot} y={pad.top} width={slot} height={plotH} fill="#f3f4f6" rx={6} />
                  )}
                  <path d={columnPath(x, y, barW, h)} fill={BAR_COLOR} opacity={hover === null || hover === i ? 1 : 0.55} />
                  {showLabel && (
                    <text x={pad.left + i * slot + slot / 2} y={height - 8} textAnchor="middle" fontSize={11} fill="#6b7280">
                      {shortDate(d.date)}
                    </text>
                  )}
                  {/* Hit target: the whole column slot, larger than the mark */}
                  <rect
                    x={pad.left + i * slot}
                    y={pad.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                  />
                </g>
              );
            })}
            <line x1={pad.left} x2={width - pad.right} y1={pad.top + plotH} y2={pad.top + plotH} stroke="#d1d5db" strokeWidth={1} />
          </svg>
          {hover !== null && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 bg-gray-950 text-white text-xs rounded-xl px-3 py-2 shadow-xl whitespace-nowrap"
              style={{ left: `${((pad.left + hover * slot + slot / 2) / width) * 100}%`, top: 0 }}
            >
              <p className="font-bold">{shortDate(data[hover].date)}</p>
              <p className="tabular-nums">
                {money(data[hover].revenue)} · {data[hover].orders} {data[hover].orders === 1 ? "order" : "orders"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bar list (single hue, value at the tip, hover title)     */
/* ------------------------------------------------------------------ */
function BarList({ rows, format }: { rows: { label: string; value: number; sub?: string }[]; format: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="text-sm text-gray-400 py-6 text-center">No data yet</p>;
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label} title={`${row.label}: ${format(row.value)}${row.sub ? ` · ${row.sub}` : ""}`}>
          <div className="flex justify-between text-xs mb-1 gap-3">
            <span className="font-semibold text-gray-800 truncate">{row.label}</span>
            <span className="text-gray-500 tabular-nums shrink-0">
              {format(row.value)}
              {row.sub ? <span className="text-gray-400"> · {row.sub}</span> : null}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-orange-50">
            <div
              className="h-full rounded-r-[4px] rounded-l-full transition-all duration-700"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%`, backgroundColor: BAR_COLOR }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatTile({ label, value, icon: Icon, hint }: { label: string; value: string; icon: typeof DollarSign; hint?: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500">{label}</p>
        <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-black text-gray-900 mt-2 tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

interface StatsResult {
  stats?: Stats;
  error?: string;
}

async function fetchStats(range: number): Promise<StatsResult> {
  try {
    const token = localStorage.getItem("nova_admin_token");
    const res = await fetch(`${API_BASE_URL}/api/admin/stats?days=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return { error: data.message || "Failed to load analytics" };
    return { stats: data.stats };
  } catch {
    return { error: "Can't reach the server" };
  }
}

export default function AdminAnalytics({ onGoToProducts, onGoToOrders }: AdminAnalyticsProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apply = useCallback((result: StatsResult) => {
    if (result.stats) {
      setStats(result.stats);
      setError("");
    } else {
      setError(result.error || "Failed to load analytics");
    }
    setLoading(false);
  }, []);

  const refresh = (range: number) => {
    setLoading(true);
    fetchStats(range).then(apply);
  };

  useEffect(() => {
    let active = true;
    fetchStats(14).then((result) => active && apply(result));
    return () => {
      active = false;
    };
  }, [apply]);

  const markRead = async (id: number) => {
    const token = localStorage.getItem("nova_admin_token");
    await fetch(`${API_BASE_URL}/api/admin/stats/messages/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setStats((prev) =>
      prev
        ? {
            ...prev,
            unreadMessages: Math.max(0, prev.unreadMessages - 1),
            recentMessages: prev.recentMessages.map((m) => (m.id === id ? { ...m, isRead: 1 } : m)),
          }
        : prev
    );
  };

  const statusRows = useMemo(() => {
    if (!stats) return [];
    const map = new Map(stats.statusBreakdown.map((s) => [s.status, s.count]));
    return STATUS_ORDER.filter((s) => map.has(s))
      .map((s) => ({ label: s, value: map.get(s) || 0 }))
      .concat(stats.statusBreakdown.filter((s) => !STATUS_ORDER.includes(s.status)).map((s) => ({ label: s.status, value: s.count })));
  }, [stats]);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-white border animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-white rounded-3xl border p-10 text-center">
        <p className="font-bold text-gray-900">Couldn't load analytics</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button onClick={() => refresh(days)} className="mt-4 bg-black text-white rounded-full px-5 py-2 text-sm font-bold">
          Try again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-white border rounded-full p-1 text-xs font-bold" role="group" aria-label="Date range">
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => {
                setDays(d);
                refresh(d);
              }}
              className={`px-4 py-1.5 rounded-full transition ${days === d ? "bg-gray-950 text-white" : "text-gray-600 hover:text-gray-950"}`}
            >
              {d} days
            </button>
          ))}
        </div>
        <button
          onClick={() => refresh(days)}
          className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 hover:text-gray-950"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Revenue" value={money(stats.totalRevenue)} icon={DollarSign} hint="All time, excl. cancelled" />
        <StatTile label="Orders" value={stats.totalOrders.toLocaleString()} icon={ShoppingBag} hint={`${stats.pendingOrders} awaiting action`} />
        <StatTile label="Avg. order value" value={money(stats.avgOrderValue)} icon={TrendingUp} />
        <StatTile label="Customers" value={stats.totalUsers.toLocaleString()} icon={Users} hint={`${stats.subscribers} newsletter subscribers`} />
      </div>

      <RevenueChart data={stats.revenueByDay} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Orders by status</h3>
            {onGoToOrders && (
              <button onClick={onGoToOrders} className="text-xs font-bold text-orange-600 hover:underline">
                Manage
              </button>
            )}
          </div>
          <BarList rows={statusRows} format={(n) => `${n}`} />
        </div>

        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Top products (units sold)</h3>
          <BarList
            rows={stats.topProducts.map((p) => ({ label: p.name, value: p.unitsSold, sub: money(p.revenue) }))}
            format={(n) => `${n}`}
          />
        </div>

        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Revenue by category</h3>
          <BarList rows={stats.categoryRevenue.map((c) => ({ label: c.category, value: c.revenue }))} format={money} />
          {stats.totalDiscounts > 0 && (
            <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1">
              <BadgePercent size={12} /> {money(stats.totalDiscounts)} given in coupon discounts
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={17} className="text-amber-500" />
              Low stock (≤ {stats.lowStockThreshold})
            </h3>
            {onGoToProducts && (
              <button onClick={onGoToProducts} className="text-xs font-bold text-orange-600 hover:underline">
                Restock
              </button>
            )}
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">Everything is well stocked 👍</p>
          ) : (
            <ul className="divide-y">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center gap-3">
                  <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover bg-gray-100" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">{p.name}</span>
                    <span className="block text-xs text-gray-400">{p.category}</span>
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                      p.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {p.stock === 0 ? <AlertTriangle size={11} /> : <Package size={11} />}
                    {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-3xl border shadow-sm p-6">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Inbox size={17} className="text-orange-500" />
            Contact inbox
            {stats.unreadMessages > 0 && (
              <span className="text-[11px] font-bold bg-orange-500 text-white rounded-full px-2 py-0.5">{stats.unreadMessages} new</span>
            )}
          </h3>
          {stats.recentMessages.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No messages yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentMessages.map((m) => (
                <li key={m.id} className={`rounded-2xl border p-3.5 ${m.isRead ? "bg-white" : "bg-orange-50/50 border-orange-100"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">
                        {m.subject} <span className="font-normal text-gray-500">· {m.name}</span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{m.message}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2.5 text-xs font-semibold">
                    <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="text-orange-600 hover:underline flex items-center gap-1">
                      <Mail size={12} /> Reply
                    </a>
                    {!m.isRead && (
                      <button onClick={() => markRead(m.id)} className="text-gray-500 hover:text-gray-900">
                        Mark as read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
