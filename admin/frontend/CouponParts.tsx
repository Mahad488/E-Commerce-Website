import type { CSSProperties } from "react";
import { Copy } from "lucide-react";
import { couponCondition, couponHeadline, type CouponStatus, type DiscountType } from "./coupons";

const STATUS: Record<CouponStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-success-tint text-success" },
  paused: { label: "Paused", className: "bg-well text-ink" },
  expired: { label: "Expired", className: "bg-error-tint text-error" },
  used_up: { label: "Used up", className: "bg-warning-tint text-warning" },
};

export function StatusPill({ status }: { status: CouponStatus }) {
  const { label, className } = STATUS[status];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-tag px-2 text-xs font-bold transition-colors duration-150 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

// Two semicircle notches where the stub is torn off (static, per the coupon ticket in docs/DESIGN.md).
const NOTCHES =
  "radial-gradient(circle 9px at calc(100% - 9rem) 0, #0000 97%, #000) top / 100% 51% no-repeat, " +
  "radial-gradient(circle 9px at calc(100% - 9rem) 100%, #0000 97%, #000) bottom / 100% 51% no-repeat";
const ticketStyle: CSSProperties = { mask: NOTCHES, WebkitMask: NOTCHES };

interface CouponTicketProps {
  code: string;
  type: DiscountType;
  value: number;
  minOrder: number;
  description: string;
}

/** How the coupon reads to a shopper. Used as the live preview in the coupon form. */
export function CouponTicket({ code, type, value, minOrder, description }: CouponTicketProps) {
  return (
    <div className="flex min-h-36 bg-surface text-ink rounded-tile" style={ticketStyle}>
      <div className="flex min-w-0 flex-1 flex-col justify-center p-5">
        <p className="text-3xl font-bold leading-none tracking-tight tabular-nums font-stretch-semi-condensed">
          {couponHeadline(type, value)}
        </p>
        <p className="mt-1.5 text-sm font-semibold">{couponCondition(minOrder)}</p>
        <p className="mt-3 line-clamp-2 text-xs text-muted">{description}</p>
      </div>
      <div className="flex w-36 shrink-0 flex-col items-center justify-center gap-2 border-l-2 border-dashed border-line p-3 text-center">
        <span className="text-xs text-muted">Code</span>
        <span
          className={`break-all font-bold tracking-wider font-stretch-semi-condensed ${code.length > 10 ? "text-sm" : "text-base"}`}
        >
          {code || "YOURCODE"}
        </span>
        <span
          aria-hidden
          className="inline-flex h-8 items-center gap-1 rounded-control border border-line-strong px-2.5 text-xs font-semibold"
        >
          <Copy size={12} /> Copy
        </span>
      </div>
    </div>
  );
}
