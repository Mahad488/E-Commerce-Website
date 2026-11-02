import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Timer, Zap } from "lucide-react";

import type { Product } from "../data/products";
import { discountPercent, fetchCatalog, getImageUrl, imageFallbackHandler, isOnSale } from "../lib/catalog";
import { useCurrency } from "../context/CurrencyContext";

/** Time left until local midnight, when "today's" deals roll over. */
function timeUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const total = Math.max(0, midnight.getTime() - now.getTime());
  return {
    hours: Math.floor(total / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        key={value}
        className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl font-black tabular-nums animate-tick"
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-white/60 mt-2 font-bold">{label}</span>
    </div>
  );
}

export default function FlashSale() {
  const { formatPrice } = useCurrency();
  const [time, setTime] = useState(timeUntilMidnight);
  const [deals, setDeals] = useState<Product[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(timeUntilMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    fetchCatalog().then(({ products }) => {
      if (!active) return;
      setDeals(
        products
          .filter((p) => isOnSale(p) && p.stock > 0)
          .sort((a, b) => discountPercent(b) - discountPercent(a))
          .slice(0, 4)
      );
    });
    return () => {
      active = false;
    };
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="py-20 lg:py-24 bg-gradient-to-br from-gray-950 via-neutral-900 to-gray-950 text-white relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-orange-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-0 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <span className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full">
              <Zap size={14} className="fill-white" />
              Flash Sale
            </span>
            <h2 className="text-4xl sm:text-5xl font-black mt-4 tracking-tight">Today's deals end in</h2>
            <p className="text-white/60 mt-2 text-sm flex items-center gap-1.5">
              <Timer size={15} /> New deals drop every night at midnight.
            </p>
          </div>
          <div className="flex items-start gap-3 sm:gap-4" aria-live="off">
            <TimeBlock value={time.hours} label="Hours" />
            <span className="text-3xl font-black pt-4 text-orange-400">:</span>
            <TimeBlock value={time.minutes} label="Minutes" />
            <span className="text-3xl font-black pt-4 text-orange-400">:</span>
            <TimeBlock value={time.seconds} label="Seconds" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:bg-white/10 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={getImageUrl(product.image, product.category)}
                  onError={imageFallbackHandler(product.category)}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-sm font-black px-3 py-1 rounded-full shadow-lg">
                  -{discountPercent(product)}%
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-white/50 font-semibold">{product.category}</p>
                <h3 className="font-bold mt-1 line-clamp-1 group-hover:text-orange-400 transition">{product.name}</h3>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-xl font-black text-orange-400">{formatPrice(product.price)}</span>
                  <span className="text-sm text-white/40 line-through">{formatPrice(product.oldPrice)}</span>
                </div>
                <p className={`text-[11px] mt-3 font-semibold ${product.stock <= 5 ? "text-amber-400" : "text-white/50"}`}>
                  {product.stock <= 5
                    ? `Only ${product.stock} left in stock`
                    : product.soldCount
                    ? `${product.soldCount} sold · ${product.stock} in stock`
                    : `${product.stock} in stock`}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/products?sale=true&sort=discount"
            className="group inline-flex items-center gap-2.5 bg-white text-gray-950 px-8 py-4 rounded-full font-black text-sm hover:bg-orange-500 hover:text-white transition-all"
          >
            Shop every deal
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
