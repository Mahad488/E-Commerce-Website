import { AlertTriangle, CheckCircle2, ExternalLink, Eye, Flame, MapPin, Pencil, Sparkles, Star, Trash2, XCircle } from "lucide-react";
import type { Product } from "../../src/data/products";
import { getImageUrl } from "../../src/lib/catalog";
import { getColorHex, type Order } from "./orderTypes";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-800 border-amber-300",
  Processing: "bg-blue-50 text-blue-800 border-blue-300",
  Shipped: "bg-purple-50 text-purple-800 border-purple-300",
  Delivered: "bg-emerald-50 text-emerald-800 border-emerald-300",
  Cancelled: "bg-red-50 text-red-800 border-red-300",
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare";

interface OrderStatusSelectProps {
  status: string;
  onChange: (status: string) => void;
  label: string;
  className?: string;
}

/** The status dropdown used by the orders table and the phone cards. */
export function OrderStatusSelect({ status, onChange, label, className = "" }: OrderStatusSelectProps) {
  return (
    <select
      aria-label={label}
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className={`border rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition ${
        STATUS_STYLES[status] || "bg-white text-gray-800 border-gray-200"
      } ${className}`}
    >
      <option value="Pending">Pending</option>
      <option value="Processing">Processing</option>
      <option value="Shipped">Shipped</option>
      <option value="Delivered">Delivered</option>
      <option value="Cancelled">Cancelled</option>
    </select>
  );
}

/** "In Stock (15)", "Low Stock (3)" or "Out of Stock". */
export function StockBadge({ stock }: { stock: number }) {
  if (stock > 5) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
        <CheckCircle2 size={12} className="text-emerald-600" />
        In Stock ({stock})
      </span>
    );
  }
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 whitespace-nowrap">
        <AlertTriangle size={12} className="text-amber-600" />
        Low Stock ({stock})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200/80 whitespace-nowrap">
      <XCircle size={12} className="text-red-600" />
      Out of Stock
    </span>
  );
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (status: string) => void;
  onView: () => void;
}

/** One order on a phone or small tablet, where the orders table can't fit. */
export function OrderCard({ order, onStatusChange, onView }: OrderCardProps) {
  return (
    <article className="rounded-tile border border-line bg-surface p-4 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black">Order #{order.id}</p>
          <p className="truncate text-sm font-semibold">{order.user_name || "Guest Customer"}</p>
          {order.user_email && <p className="truncate text-xs text-muted">{order.user_email}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-black tabular-nums">${Number(order.total_amount).toFixed(2)}</p>
          <p className="text-xs text-muted">{new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {order.items && order.items.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-line pt-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5">
              <img
                src={getImageUrl(item.color_image || item.product_image)}
                alt=""
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-control bg-well object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{item.product_name || `Product #${item.product_id}`}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-line-strong"
                    style={{ backgroundColor: getColorHex(item.color) }}
                  />
                  <span className="truncate">{item.color || "Standard"}</span>
                  <span className="shrink-0">· Qty {item.quantity}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {order.address && (
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
          <MapPin size={14} className="mt-px shrink-0" aria-hidden />
          <span className="line-clamp-2">
            {order.address}
            {order.city ? `, ${order.city}` : ""}
          </span>
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <OrderStatusSelect
          status={order.status}
          onChange={onStatusChange}
          label={`Status of order #${order.id}`}
          className="h-11 w-full min-w-0"
        />
        <button
          type="button"
          onClick={onView}
          className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface text-sm font-semibold transition-colors hover:bg-porcelain ${focusRing}`}
        >
          <Eye size={16} aria-hidden /> View details
        </button>
      </div>
    </article>
  );
}

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
}

/** One product on a phone or small tablet, where the products table can't fit. */
export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const price = Number(product.price);
  const oldPrice = Number(product.oldPrice) || 0;
  const rating = Number(product.rating) || 0;
  const onSale = oldPrice > price;

  return (
    <article className="rounded-tile border border-line bg-surface p-3 text-ink">
      <div className="flex gap-3">
        <img
          src={getImageUrl(product.image, product.category)}
          alt=""
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-control bg-well object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-bold">{product.name}</p>
          <p className="truncate text-xs text-muted">
            #{product.id} · {product.category}
          </p>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
            <span className="font-bold tabular-nums">${price.toFixed(2)}</span>
            {onSale && <span className="text-xs tabular-nums text-muted line-through">${oldPrice.toFixed(2)}</span>}
            {onSale && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-rose-600">
                <Flame size={10} className="fill-rose-500 text-rose-500" aria-hidden />-{Math.round(((oldPrice - price) / oldPrice) * 100)}%
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StockBadge stock={Number(product.stock) || 0} />
        {rating === 0 ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200/80">
            <Sparkles size={11} aria-hidden /> New
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden /> {rating.toFixed(1)}
          </span>
        )}
        {product.colors && product.colors.length > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-muted">
            {product.colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="h-2.5 w-2.5 rounded-full border border-line-strong"
                style={{ backgroundColor: color.hex || "#000" }}
              />
            ))}
            {product.colors.length} {product.colors.length === 1 ? "color" : "colors"}
          </span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className={`inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-ink text-sm font-semibold text-white transition-colors hover:bg-night ${focusRing}`}
        >
          <Pencil size={15} aria-hidden /> Edit
        </button>
        <a
          href={`/products/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${product.name} in the store`}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line-strong text-ink transition-colors hover:bg-porcelain ${focusRing}`}
        >
          <ExternalLink size={16} aria-hidden />
        </a>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${product.name}`}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-error text-error transition-colors hover:bg-error-tint ${focusRing}`}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </article>
  );
}
