import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X, ArrowRight } from "lucide-react";

import { FREE_SHIPPING_THRESHOLD, useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";

/**
 * Slide-out mini cart. Opens automatically whenever something is added.
 */
export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    subtotal,
    amountToFreeShipping,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    maxQuantityFor,
    cartCount,
  } = useCart();
  const { formatPrice } = useCurrency();
  const location = useLocation();

  // Close when navigating and on Escape.
  useEffect(() => {
    closeCart();
  }, [location.pathname, closeCart]);

  useEffect(() => {
    if (!isCartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isCartOpen, closeCart]);

  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div
      className={`fixed inset-0 z-[80] ${isCartOpen ? "" : "pointer-events-none"}`}
      aria-hidden={!isCartOpen}
      inert={!isCartOpen}
    >
      <div
        onClick={closeCart}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={20} className="text-orange-500" />
            <h2 className="font-black text-lg">Your Cart</h2>
            <span className="text-xs font-bold bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{cartCount}</span>
          </div>
          <button onClick={closeCart} aria-label="Close cart" className="p-2 rounded-full hover:bg-gray-100 transition">
            <X size={20} />
          </button>
        </header>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div className="px-6 py-4 bg-orange-50/60 border-b border-orange-100">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
              <Truck size={15} className="text-orange-500 shrink-0" />
              {amountToFreeShipping > 0 ? (
                <span>
                  Add <strong className="text-orange-600">{formatPrice(amountToFreeShipping)}</strong> more for free shipping
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">You've unlocked free shipping! 🎉</span>
              )}
            </p>
            <div className="mt-2 h-2 rounded-full bg-orange-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                style={{ width: `${amountToFreeShipping > 0 ? progress : 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-400" />
              </div>
              <p className="font-bold mt-5">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Find something you love.</p>
              <Link
                to="/products"
                className="mt-6 bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-orange-500 transition"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((item) => {
                const max = maxQuantityFor(item);
                return (
                  <li key={`${item.product.id}-${item.selectedColor}`} className="py-4 flex gap-4">
                    <Link to={`/products/${item.product.id}`} className="shrink-0">
                      <img
                        src={getImageUrl(item.selectedColorImage || item.product.image, item.product.category)}
                        onError={imageFallbackHandler(item.product.category)}
                        alt={item.product.name}
                        className="w-20 h-20 rounded-xl object-cover bg-gray-100 border"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="font-semibold text-sm leading-snug hover:text-orange-600 line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                          aria-label={`Remove ${item.product.name}`}
                          className="text-gray-400 hover:text-red-500 transition shrink-0"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      {item.selectedColor && item.selectedColor !== "Standard" && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.selectedColor}</p>
                      )}
                      <div className="flex items-center justify-between mt-2.5">
                        <div className="flex items-center border rounded-full">
                          <button
                            onClick={() => decreaseQuantity(item.product.id, item.selectedColor)}
                            aria-label="Decrease quantity"
                            className="p-1.5 hover:bg-gray-100 rounded-full"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2.5 text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => increaseQuantity(item.product.id, item.selectedColor)}
                            disabled={item.quantity >= max}
                            aria-label="Increase quantity"
                            className="p-1.5 hover:bg-gray-100 rounded-full disabled:opacity-30"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <span className="font-bold text-sm">{formatPrice(item.product.price * item.quantity)}</span>
                      </div>
                      {item.quantity >= max && <p className="text-[11px] text-amber-600 mt-1">Max available</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t px-6 py-5 space-y-3 bg-white">
            <div className="flex justify-between font-bold">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-gray-500">Shipping and discounts are calculated at checkout.</p>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                to="/cart"
                className="text-center border border-gray-300 rounded-full py-3 text-sm font-bold hover:bg-gray-50 transition"
              >
                View cart
              </Link>
              <Link
                to="/checkout"
                className="text-center bg-black text-white rounded-full py-3 text-sm font-bold hover:bg-orange-500 transition flex items-center justify-center gap-1.5"
              >
                Checkout <ArrowRight size={15} />
              </Link>
            </div>
          </footer>
        )}
      </aside>
    </div>
  );
}
