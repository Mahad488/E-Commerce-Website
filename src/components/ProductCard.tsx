import { Heart, Plus, Star } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";

import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";
import { discountPercent, getImageUrl, imageFallbackHandler, isOnSale } from "../lib/catalog";
import { burstAt, FLARE_COLORS } from "../lib/flare";
import { DUR, EASE_CSS, hasFinePointer, prefersReducedMotion } from "../lib/motion";
import AnimatedNumber from "./motion/AnimatedNumber";
import { useFlyToCart } from "./motion/flyToCartContext";
import QuickViewModal from "./QuickViewModal";

interface ProductCardProps {
  product: Product;
}

/**
 * Product card (DESIGN.md §7): no container. A 4:5 image well with one tag,
 * favourite, colour dots and quick-add; name, price and rating below.
 * Desktop adds `tilt` + glare and `swap` (hover shows the next colour).
 */
export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { currentCurrency, formatPrice } = useCurrency();
  const { fly } = useFlyToCart();
  const colors = product.colors ?? [];
  const [selected, setSelected] = useState<ProductColorVariant | null>(colors[0] ?? null);
  const [previewColor, setPreviewColor] = useState<ProductColorVariant | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const tileRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLSpanElement>(null);
  const heartRef = useRef<HTMLButtonElement>(null);

  const inWishlist = isInWishlist(product.id);
  const price = Number(product.price) || 0;
  const oldPrice = Number(product.oldPrice) || 0;
  const sale = isOnSale(product);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;
  const reviews = product.reviewCount ?? 0;
  const href = `/products/${product.id}`;

  const shown = previewColor ?? selected;
  const imageUrl = getImageUrl(shown?.image || product.image, product.category);

  // One tag per card: Sold out > discount > Bestseller.
  const tag = outOfStock ? (
    <span className="tag tag-out">Sold out</span>
  ) : sale ? (
    <span className="tag tag-deal">−{discountPercent(product)}%</span>
  ) : (product.soldCount ?? 0) >= 3 ? (
    <span className="tag tag-best">Bestseller</span>
  ) : null;

  const handleAdd = () => {
    const color = selected;
    const url = getImageUrl(color?.image || product.image, product.category);
    fly(tileRef.current, url).then(() => addToCart(product, color?.name, color?.image));
  };

  const handleFavourite = () => {
    const adding = !inWishlist;
    toggleWishlist(product);
    showToast(adding ? `Saved ${product.name} to your wishlist` : `Removed ${product.name} from your wishlist`, adding ? "success" : "info");
    const icon = heartRef.current?.querySelector("svg");
    if (prefersReducedMotion() || !icon) return;
    if (adding) {
      icon.animate([{ transform: "scale(.6)" }, { transform: "scale(1.25)", offset: 0.5 }, { transform: "scale(1)" }], { duration: 420, easing: EASE_CSS.pop });
      burstAt(heartRef.current, { rays: 7, length: 9, distance: 15, colors: [FLARE_COLORS.pink, FLARE_COLORS.marigold] });
    } else {
      icon.animate([{ transform: "scale(1)" }, { transform: "scale(.8)", offset: 0.4 }, { transform: "scale(1)" }], { duration: 240, easing: EASE_CSS.out });
    }
  };

  // Desktop only: the tile tilts toward the cursor and a soft glare follows it.
  const onTilt = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || prefersReducedMotion()) return;
    const tile = tileRef.current;
    if (!tile) return;
    const r = tile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tile.style.transform = `perspective(800px) rotateX(${(-y * 9).toFixed(2)}deg) rotateY(${(x * 11).toFixed(2)}deg) translateY(-3px)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = "1";
      glareRef.current.style.transform = `translate(${(x * 45).toFixed(1)}%, ${(y * 45).toFixed(1)}%)`;
    }
  };

  const onEnter = () => {
    if (!hasFinePointer() || colors.length < 2) return;
    const i = Math.max(0, colors.findIndex((c) => c.name === selected?.name));
    setPreviewColor(colors[(i + 1) % colors.length]);
  };

  const onLeave = () => {
    setPreviewColor(null);
    if (tileRef.current) tileRef.current.style.transform = "";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <>
      <article className="group flex min-w-0 flex-col gap-2.5">
        <div
          ref={tileRef}
          onPointerMove={onTilt}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          className="well aspect-[4/5] transition-transform duration-200 ease-nova-out"
        >
          <Link to={href} className="absolute inset-0" aria-label={product.name}>
            <AnimatePresence initial={false}>
              <m.img
                key={imageUrl}
                src={imageUrl}
                alt=""
                loading="lazy"
                onError={imageFallbackHandler(product.category)}
                className={`absolute inset-0 h-full w-full object-cover mix-blend-multiply ${outOfStock ? "opacity-60 grayscale" : ""}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DUR.quick }}
              />
            </AnimatePresence>
          </Link>
          <span
            ref={glareRef}
            aria-hidden="true"
            className="pointer-events-none absolute -left-1/4 -top-1/4 z-[1] aspect-square w-[150%] bg-[radial-gradient(closest-side,rgb(255_255_255/.5),rgb(255_255_255/0))] opacity-0 transition-opacity duration-200"
          />

          <div className="pointer-events-none absolute inset-x-2 top-2 z-10 flex items-start justify-between">
            <span className="pt-0.5">{tag}</span>
            <button
              ref={heartRef}
              type="button"
              onClick={handleFavourite}
              aria-pressed={inWishlist}
              aria-label={inWishlist ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
              className={`icon-btn pointer-events-auto -mr-1 -mt-1.5 hover:bg-white/60 ${inWishlist ? "text-flare" : "text-ink"}`}
            >
              <Heart size={21} className={inWishlist ? "fill-current" : ""} />
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-2.5 bottom-2 z-10 flex items-end justify-between gap-2">
            {colors.length > 0 ? (
              <div className="pointer-events-auto flex gap-2 pb-1.5" role="group" aria-label="Colours">
                {colors.slice(0, 4).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelected(c);
                      setPreviewColor(null);
                    }}
                    aria-pressed={selected?.name === c.name}
                    aria-label={c.name}
                    className={`relative h-4 w-4 rounded-full border-2 border-white before:absolute before:-inset-x-1.5 before:-inset-y-3 before:content-[''] ${
                      selected?.name === c.name ? "ring-2 ring-flare" : "ring-1 ring-line-strong"
                    }`}
                    style={{ backgroundColor: c.hex || "#000" }}
                  />
                ))}
              </div>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              className="pointer-events-auto hidden h-9 rounded-full bg-surface/95 px-3.5 text-[0.8125rem] font-semibold opacity-0 shadow-lift transition-opacity duration-150 focus-visible:opacity-100 group-hover:opacity-100 lg:inline-flex lg:items-center"
            >
              Quick view
            </button>
            {!outOfStock && (
              <button
                type="button"
                onClick={handleAdd}
                aria-label={`Add ${product.name} to cart`}
                className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white transition-[background-color,transform] duration-150 hover:bg-flare active:scale-90"
              >
                <Plus size={20} />
              </button>
            )}
          </div>
        </div>

        <Link to={href} className="type-h3 line-clamp-2 hover:underline hover:underline-offset-4">
          {product.name}
        </Link>
        <div className="-mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <AnimatedNumber value={price} format={formatPrice} className="type-price text-[1.0625rem]" />
          {sale && <span className="price-old text-sm">{formatPrice(oldPrice)}</span>}
          {currentCurrency.code !== "USD" && <span className="w-full text-xs text-muted">≈ ${price.toFixed(2)} USD</span>}
        </div>
        {reviews > 0 && Number(product.rating) > 0 && (
          <div className="flex items-center gap-1 text-[0.8125rem] text-muted">
            <Star size={14} className="fill-marigold text-marigold" aria-hidden="true" />
            <span>
              {Number(product.rating).toFixed(1)} ({reviews})
            </span>
          </div>
        )}
        {lowStock && <p className="text-[0.8125rem] font-semibold text-warning">Only {product.stock} left</p>}
      </article>

      <AnimatePresence>{quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}</AnimatePresence>
    </>
  );
}
