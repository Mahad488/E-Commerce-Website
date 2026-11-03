import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Minus, Plus, X } from "lucide-react";

import { FREE_SHIPPING_THRESHOLD, useCart, type CartItem } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";
import { burst, FLARE_COLORS } from "../lib/flare";
import { DUR, EASE, SPRING } from "../lib/motion";
import { useFocusTrap } from "../lib/useFocusTrap";
import AnimatedNumber from "./motion/AnimatedNumber";

/**
 * The mini cart. Opens automatically when something is added (after the photo
 * lands in the bag), springs in from the right, traps focus and returns it on close.
 */
export default function CartDrawer() {
  const { isCartOpen, closeCart } = useCart();
  const location = useLocation();

  // Close when navigating.
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

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div key="cart" className="fixed inset-0 z-[80]">
          <m.div
            className="absolute inset-0 bg-night/50"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: DUR.quick } }}
            exit={{ opacity: 0, transition: { duration: DUR.quick } }}
          />
          <CartPanel />
        </div>
      )}
    </AnimatePresence>
  );
}

function CartPanel() {
  const { items, closeCart, subtotal, amountToFreeShipping, cartCount } = useCart();
  const { formatPrice } = useCurrency();
  const panelRef = useFocusTrap<HTMLElement>(true);

  return (
    <m.aside
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
      tabIndex={-1}
      className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-surface pb-[env(safe-area-inset-bottom,0px)] shadow-overlay outline-none sm:rounded-l-sheet"
      initial={{ x: "100%" }}
      animate={{ x: 0, transition: SPRING.sheet }}
      exit={{ x: "100%", transition: { duration: 0.26, ease: EASE.in } }}
    >
      <header className="flex items-center justify-between pb-2 pl-5 pr-3 pt-[calc(12px+env(safe-area-inset-top,0px))]">
        <h2 id="cart-title" className="type-h2 text-[1.375rem]">
          Your cart <span className="text-muted font-medium">({cartCount})</span>
        </h2>
        <button type="button" onClick={closeCart} aria-label="Close cart" className="icon-btn" data-autofocus>
          <X size={22} />
        </button>
      </header>

      {items.length > 0 && <FreeDeliveryMeter subtotal={subtotal} remaining={amountToFreeShipping} />}

      <div className="flex-1 overflow-y-auto px-5">
        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="type-h3">Your cart is empty.</p>
            <p className="text-sm text-muted">Tap + on any product to add it.</p>
            <Link to="/products" onClick={closeCart} className="btn btn-primary mt-4">
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="isolate">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <CartLine key={`${item.product.id}-${item.selectedColor}`} item={item} />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <footer className="space-y-3 border-t border-line px-5 pb-5 pt-4">
          <div className="flex items-baseline justify-between">
            <span className="type-h3">Subtotal</span>
            <AnimatedNumber value={subtotal} format={formatPrice} className="type-price text-2xl" />
          </div>
          <p className="text-sm text-muted">Delivery and discounts are worked out at checkout.</p>
          <Link to="/checkout" onClick={closeCart} className="btn btn-buy w-full">
            Checkout
          </Link>
          <Link to="/cart" onClick={closeCart} className="btn btn-secondary w-full">
            View cart
          </Link>
        </footer>
      )}
    </m.aside>
  );
}

function FreeDeliveryMeter({ subtotal, remaining }: { subtotal: number; remaining: number }) {
  const { formatPrice } = useCurrency();
  const unlocked = remaining <= 0;
  const progress = unlocked ? 1 : Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  const barRef = useRef<HTMLDivElement>(null);
  const wasUnlocked = useRef(unlocked);

  // `fill` + mini flare when the meter reaches 100% (not when it opens already full).
  useEffect(() => {
    if (unlocked && !wasUnlocked.current) {
      const timer = window.setTimeout(() => {
        const r = barRef.current?.getBoundingClientRect();
        if (r) burst(r.right - 4, r.top + r.height / 2, { rays: 10, distance: 16, colors: [FLARE_COLORS.marigold, FLARE_COLORS.pink], sparks: 3, zIndex: 90 });
      }, 700);
      wasUnlocked.current = unlocked;
      return () => window.clearTimeout(timer);
    }
    wasUnlocked.current = unlocked;
  }, [unlocked]);

  return (
    <div className="grid gap-2 border-b border-line px-5 pb-4">
      <p className="text-sm" aria-live="polite">
        {unlocked ? (
          <span className="font-semibold">Free delivery unlocked</span>
        ) : (
          <>
            Add <span className="font-semibold">{formatPrice(remaining)}</span> more for free delivery
          </>
        )}
      </p>
      <div ref={barRef} className="relative h-2 overflow-hidden rounded-full bg-well">
        <m.div
          className={`absolute inset-0 origin-left rounded-full ${unlocked ? "bg-marigold" : "bg-flare"}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE.out }}
        />
      </div>
    </div>
  );
}

function CartLine({ item }: { item: CartItem }) {
  const { increaseQuantity, decreaseQuantity, removeFromCart, maxQuantityFor, lastAdded, closeCart } = useCart();
  const { formatPrice } = useCurrency();
  const max = maxQuantityFor(item);
  const fresh = lastAdded && lastAdded.productId === item.product.id && lastAdded.selectedColor === item.selectedColor;
  const href = `/products/${item.product.id}`;

  return (
    <m.li
      layout="position"
      exit={{ opacity: 0, x: 40, transition: { duration: 0.19, ease: EASE.in } }}
      transition={SPRING.layout}
      className="relative grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3 last:border-b-0"
    >
      {fresh && (
        <m.span
          key={lastAdded.at}
          aria-hidden="true"
          className="absolute -inset-x-2.5 inset-y-0.5 -z-10 rounded-control bg-flare-tint"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.35, ease: EASE.out }}
        />
      )}
      <Link to={href} onClick={closeCart} className="well block aspect-[4/5] w-16 rounded-control">
        <img
          src={getImageUrl(item.selectedColorImage || item.product.image, item.product.category)}
          onError={imageFallbackHandler(item.product.category)}
          alt={item.product.name}
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="grid min-w-0 gap-1">
        <Link to={href} onClick={closeCart} className="line-clamp-2 text-[0.9375rem] font-semibold leading-tight hover:underline">
          {item.product.name}
        </Link>
        {item.selectedColor && item.selectedColor !== "Standard" && <span className="text-[0.8125rem] text-muted">{item.selectedColor}</span>}
        <div className="flex items-center gap-3">
          <div className="inline-flex h-9 items-center rounded-control border border-line-strong">
            <button
              type="button"
              onClick={() => decreaseQuantity(item.product.id, item.selectedColor)}
              aria-label={`Remove one ${item.product.name}`}
              className="grid h-9 w-9 place-items-center"
            >
              <Minus size={15} />
            </button>
            <AnimatedNumber value={item.quantity} className="min-w-6 text-center text-[0.9375rem] font-semibold tabular-nums" />
            <button
              type="button"
              onClick={() => increaseQuantity(item.product.id, item.selectedColor)}
              disabled={item.quantity >= max}
              aria-label={`Add one more ${item.product.name}`}
              className="grid h-9 w-9 place-items-center disabled:opacity-30"
            >
              <Plus size={15} />
            </button>
          </div>
          {item.quantity >= max && <span className="text-xs text-warning">Max available</span>}
        </div>
      </div>
      <div className="grid justify-items-end gap-1.5">
        <AnimatedNumber value={item.product.price * item.quantity} format={formatPrice} className="type-price text-base" />
        <button
          type="button"
          onClick={() => removeFromCart(item.product.id, item.selectedColor)}
          className="text-[0.8125rem] text-muted underline underline-offset-[3px] hover:text-error"
        >
          Remove
        </button>
      </div>
    </m.li>
  );
}
