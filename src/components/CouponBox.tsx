import { useState } from "react";
import { Tag, X } from "lucide-react";

import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";

/** Apply / remove a coupon. Used on the cart and checkout pages. */
export default function CouponBox() {
  const { coupon, couponError, couponLoading, applyCoupon, removeCoupon, discount, subtotal } = useCart();
  const { formatPrice } = useCurrency();
  const [code, setCode] = useState("");

  if (coupon) {
    const belowMinimum = subtotal < coupon.minOrder;
    return (
      <div
        className={`rounded-xl border px-3.5 py-3 text-sm flex items-start justify-between gap-3 ${
          belowMinimum ? "border-amber-300 bg-amber-50" : "border-emerald-300 bg-emerald-50"
        }`}
      >
        <div>
          <p className="font-bold flex items-center gap-1.5">
            <Tag size={14} className={belowMinimum ? "text-amber-600" : "text-emerald-600"} />
            {coupon.code}
          </p>
          <p className={`text-xs mt-0.5 ${belowMinimum ? "text-amber-800" : "text-emerald-800"}`}>
            {belowMinimum
              ? `Add ${formatPrice(coupon.minOrder - subtotal)} more to use this code`
              : coupon.type === "shipping"
              ? "Free shipping applied"
              : `You save ${formatPrice(discount)}`}
          </p>
        </div>
        <button type="button" onClick={removeCoupon} aria-label="Remove coupon" className="text-gray-500 hover:text-gray-900">
          <X size={16} />
        </button>
      </div>
    );
  }

  const submit = async () => {
    if (await applyCoupon(code)) setCode("");
  };

  // Not a <form>: this box sits inside the checkout form, and nested forms would submit the order.
  return (
    <div>
      <label htmlFor="coupon" className="text-xs font-bold text-gray-600 uppercase tracking-wider">
        Coupon code
      </label>
      <div className="flex gap-2 mt-1.5">
        <input
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="e.g. WELCOME10"
          autoComplete="off"
          className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-orange-500 bg-white uppercase"
        />
        <button
          type="button"
          onClick={submit}
          disabled={couponLoading || !code.trim()}
          className="bg-gray-900 text-white rounded-xl px-4 text-sm font-bold hover:bg-orange-500 transition disabled:opacity-40"
        >
          {couponLoading ? "…" : "Apply"}
        </button>
      </div>
      {couponError && <p className="text-xs text-rose-600 mt-1.5">{couponError}</p>}
    </div>
  );
}
