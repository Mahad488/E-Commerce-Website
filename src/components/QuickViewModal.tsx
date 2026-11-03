import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, m, useDragControls } from "motion/react";
import { Minus, Plus, Star, X } from "lucide-react";

import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { discountPercent, getImageUrl, imageFallbackHandler, isOnSale } from "../lib/catalog";
import { DUR, EASE, SPRING } from "../lib/motion";
import { useFocusTrap } from "../lib/useFocusTrap";
import { useMediaQuery } from "../lib/useMediaQuery";
import AnimatedNumber from "./motion/AnimatedNumber";
import { useFlyToCart } from "./motion/flyToCartContext";

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

/**
 * Quick view: a centred modal on desktop, a bottom sheet on phones (drag the
 * handle down to close). Render it inside <AnimatePresence> so it can animate out.
 */
export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { fly } = useFlyToCart();
  const desktop = useMediaQuery("(min-width: 768px)");
  const dragControls = useDragControls();
  const panelRef = useFocusTrap<HTMLDivElement>(true);
  const imageRef = useRef<HTMLDivElement>(null);
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
  const imageUrl = getImageUrl(color?.image || product.image, product.category);
  const titleId = `quick-view-${product.id}`;

  const handleAdd = () => {
    const chosen = color;
    const qty = quantity;
    fly(imageRef.current, imageUrl).then(() => addToCart(product, chosen?.name, chosen?.image, qty));
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center md:items-center md:p-6">
      <m.div
        className="absolute inset-0 bg-night/55"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DUR.quick } }}
        exit={{ opacity: 0, transition: { duration: DUR.quick } }}
      />
      <m.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative grid max-h-[92vh] w-full overflow-y-auto rounded-t-sheet bg-surface shadow-overlay outline-none md:max-w-3xl md:grid-cols-2 md:rounded-sheet"
        initial={desktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: "100%" }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: SPRING.sheet }}
        exit={desktop ? { opacity: 0, scale: 0.97, transition: { duration: DUR.quick, ease: EASE.in } } : { y: "100%", transition: { duration: 0.26, ease: EASE.in } }}
        drag={desktop ? false : "y"}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
        }}
      >
        {/* Drag handle (phones) */}
        <div
          className="absolute inset-x-0 top-0 z-20 flex h-7 cursor-grab touch-none justify-center pt-2.5 md:hidden"
          onPointerDown={(e) => dragControls.start(e)}
          aria-hidden="true"
        >
          <span className="h-1 w-10 rounded-full bg-white/80 shadow" />
        </div>

        <button type="button" onClick={onClose} aria-label="Close quick view" className="icon-btn absolute right-3 top-3 z-20 bg-surface/90" data-autofocus>
          <X size={20} />
        </button>

        <div ref={imageRef} className="well relative aspect-square rounded-none md:aspect-auto md:min-h-[440px]">
          <AnimatePresence initial={false}>
            <m.img
              key={imageUrl}
              src={imageUrl}
              onError={imageFallbackHandler(product.category)}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.quick }}
            />
          </AnimatePresence>
          {sale && <span className="tag tag-deal absolute left-4 top-4">−{discountPercent(product)}%</span>}
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="grid gap-1.5 pr-10">
            <span className="text-sm text-muted">{product.category}</span>
            <h2 id={titleId} className="type-h2">
              {product.name}
            </h2>
            {product.rating > 0 && (product.reviewCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <Star size={15} className="fill-marigold text-marigold" aria-hidden="true" />
                <span className="font-semibold text-ink">{product.rating.toFixed(1)}</span>
                <span>
                  ({product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
            <AnimatedNumber value={product.price} format={formatPrice} className="type-price text-[2rem]" />
            {sale && <span className="price-old">{formatPrice(product.oldPrice)}</span>}
            {sale && <span className="tag tag-deal">You save {formatPrice(product.oldPrice - product.price)}</span>}
          </div>

          <p className="line-clamp-4 text-[0.9375rem] text-muted">{product.description}</p>

          {product.colors && product.colors.length > 0 && (
            <div>
              <p className="type-label mb-2">
                Colour: <span className="font-normal">{color?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Colour">
                {product.colors.map((c) => {
                  const selected = color?.name === c.name;
                  const soldOut = Number(c.quantity) <= 0;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setColor(c);
                        setQuantity(1);
                      }}
                      aria-pressed={selected}
                      aria-label={`${c.name}${soldOut ? ", sold out" : `, ${c.quantity} in stock`}`}
                      className={`h-9 w-9 rounded-full border-2 border-white transition-transform active:scale-90 ${
                        selected ? "ring-2 ring-flare" : "ring-1 ring-line-strong"
                      } ${soldOut ? "opacity-40" : ""}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <p className={`text-sm font-semibold ${stock > 5 ? "text-success" : stock > 0 ? "text-warning" : "text-error"}`}>
            {stock > 5 ? "In stock" : stock > 0 ? `Only ${stock} left` : "Sold out in this colour"}
          </p>

          <div className="mt-auto flex items-center gap-3 pt-2">
            <div className="inline-flex h-12 items-center rounded-control border border-line-strong">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="grid h-12 w-11 place-items-center"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <AnimatedNumber value={quantity} className="w-7 text-center font-semibold tabular-nums" />
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={quantity >= stock}
                className="grid h-12 w-11 place-items-center disabled:opacity-30"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>
            <button type="button" disabled={stock <= 0} onClick={handleAdd} className="btn btn-buy flex-1">
              Add to cart
            </button>
          </div>

          <Link to={`/products/${product.id}`} onClick={onClose} className="self-start text-sm font-semibold underline underline-offset-4 hover:text-flare">
            View full details
          </Link>
        </div>
      </m.div>
    </div>,
    document.body
  );
}
