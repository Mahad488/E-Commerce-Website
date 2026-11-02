import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, Flame, Sparkles, Tag } from "lucide-react";

import { API_BASE_URL } from "../config/api";

interface PublicCoupon {
  code: string;
  description: string;
}

const FALLBACK_COUPONS: PublicCoupon[] = [
  { code: "WELCOME10", description: "10% off your first order" },
  { code: "FREESHIP", description: "Free shipping on any order" },
];

export default function PromoBanner() {
  const [coupons, setCoupons] = useState<PublicCoupon[]>(FALLBACK_COUPONS);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE_URL}/api/coupons/public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.coupons) && data.coupons.length > 0) setCoupons(data.coupons.slice(0, 4));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(""), 1800);
    } catch {
      // clipboard blocked — the code is visible anyway
    }
  };

  return (
    <section className="bg-neutral-950 py-16 lg:py-24 text-white relative overflow-hidden scroll-reveal">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8 relative z-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 animate-gradient-x p-8 sm:p-12 md:p-16 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-white/20">
                <Flame size={14} className="text-amber-300" />
                <span>Extra savings</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Stack a code on top of sale prices
              </h2>
              <p className="mt-4 text-orange-50 text-sm sm:text-base max-w-lg leading-relaxed">
                Tap a code to copy it, then paste it in your cart or at checkout.
              </p>
              <Link
                to="/products?sale=true"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-black text-gray-950 hover:bg-black hover:text-white shadow-2xl active:scale-95 transition-all duration-300"
              >
                <Sparkles size={16} className="text-orange-500 group-hover:text-amber-400" />
                Shop the sale
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 lg:w-[460px] shrink-0">
              {coupons.map((coupon) => (
                <button
                  key={coupon.code}
                  onClick={() => copy(coupon.code)}
                  className="group text-left bg-black/25 hover:bg-black/40 border-2 border-dashed border-white/40 hover:border-white rounded-2xl p-4 backdrop-blur-sm transition"
                >
                  <span className="flex items-center justify-between font-mono font-black text-lg tracking-wider">
                    <span className="flex items-center gap-2">
                      <Tag size={16} />
                      {coupon.code}
                    </span>
                    {copied === coupon.code ? <Check size={16} /> : <Copy size={15} className="opacity-60 group-hover:opacity-100" />}
                  </span>
                  <span className="block text-xs text-white/85 mt-1">
                    {copied === coupon.code ? "Copied!" : coupon.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
