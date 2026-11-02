import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Star, X, ArrowRight } from "lucide-react";

import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { discountPercent, getImageUrl, imageFallbackHandler, isOnSale } from "../lib/catalog";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [color, setColor] = useState<ProductColorVariant | null>(product.colors?.[0] ?? null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const stock = color && color.quantity !== undefined ? Number(color.quantity) : product.stock;
  const sale = isOnSale(product);

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-label={`Quick view: ${product.name}`}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto grid md:grid-cols-2 animate-pop-in">
        <button
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 shadow hover:bg-gray-100"
        >
          <X size={18} />
        </button>

        <div className="relative bg-gray-50 aspect-square md:aspect-auto">
          <img
            key={color?.image || product.image}
            src={getImageUrl(color?.image || product.image, product.category)}
            onError={imageFallbackHandler(product.category)}
            alt={product.name}
            className="w-full h-full object-cover animate-fade-in"
          />
          {sale && (
            <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-black px-3 py-1 rounded-full">
              -{discountPercent(product)}%
            </span>
          )}
        </div>

        <div className="p-6 sm:p-8 flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">{product.category}</span>
          <h2 className="text-2xl font-black mt-2 pr-8">{product.name}</h2>

          {product.rating > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span className="font-bold">{product.rating.toFixed(1)}</span>
              {product.reviewCount ? <span className="text-gray-400">({product.reviewCount} reviews)</span> : null}
            </div>
          )}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-2xl font-black">{formatPrice(product.price)}</span>
            {sale && <span className="text-gray-400 line-through">{formatPrice(product.oldPrice)}</span>}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mt-4 line-clamp-4">{product.description}</p>

          {product.colors && product.colors.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-bold text-gray-700 mb-2">
                Colour: <span className="text-orange-600">{color?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      setColor(c);
                      setQuantity(1);
                    }}
                    title={`${c.name} — ${c.quantity} in stock`}
                    aria-label={c.name}
                    className={`w-8 h-8 rounded-full border-2 transition ${
                      color?.name === c.name ? "border-orange-500 scale-110 shadow" : "border-gray-200"
                    } ${Number(c.quantity) <= 0 ? "opacity-40" : ""}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          <p className={`text-xs font-bold mt-4 ${stock > 5 ? "text-emerald-600" : stock > 0 ? "text-amber-600" : "text-red-500"}`}>
            {stock > 5 ? "In stock" : stock > 0 ? `Only ${stock} left — order soon` : "Out of stock"}
          </p>

          <div className="flex items-center gap-3 mt-auto pt-6">
            <div className="flex items-center border rounded-full">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-3 hover:bg-gray-100 rounded-full"
                aria-label="Decrease quantity"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock}
                className="p-3 hover:bg-gray-100 rounded-full disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              disabled={stock <= 0}
              onClick={() => {
                addToCart(product, color?.name, color?.image, quantity);
                onClose();
              }}
              className="flex-1 bg-black text-white rounded-full py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-500 transition disabled:opacity-40"
            >
              <ShoppingCart size={16} />
              Add to cart
            </button>
          </div>

          <Link
            to={`/products/${product.id}`}
            onClick={onClose}
            className="mt-4 text-sm font-semibold text-gray-600 hover:text-orange-600 inline-flex items-center gap-1.5 self-start"
          >
            View full details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
