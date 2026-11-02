import { useState } from "react";
import { Link } from "react-router-dom";
import { History } from "lucide-react";

import { getRecentlyViewed } from "../lib/recentlyViewed";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";
import { useCurrency } from "../context/CurrencyContext";

interface RecentlyViewedProps {
  excludeId?: number;
  title?: string;
}

/** Horizontal strip of products the shopper looked at recently (stored in localStorage). */
export default function RecentlyViewed({ excludeId, title = "Recently viewed" }: RecentlyViewedProps) {
  const { formatPrice } = useCurrency();
  const [items] = useState(() => getRecentlyViewed().filter((p) => p.id !== excludeId).slice(0, 6));

  if (items.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-5 lg:px-8 py-14">
      <h2 className="text-xl font-black flex items-center gap-2 mb-6">
        <History size={20} className="text-orange-500" />
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x">
        {items.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="group shrink-0 w-40 snap-start rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={getImageUrl(product.image, product.category)}
              onError={imageFallbackHandler(product.category)}
              alt={product.name}
              loading="lazy"
              className="w-full h-36 object-cover bg-gray-50 group-hover:scale-105 transition duration-500"
            />
            <div className="p-3">
              <p className="text-xs font-semibold line-clamp-1 group-hover:text-orange-600">{product.name}</p>
              <p className="text-sm font-black mt-1">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
