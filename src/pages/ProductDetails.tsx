import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MessageSquare,
  Heart,
  Flame,
  Share2,
  Truck,
  RotateCcw,
  ShieldCheck,
  BadgeCheck,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import RecentlyViewed from "../components/RecentlyViewed";

import { API_BASE_URL } from "../config/api";
import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  discountPercent,
  fetchProduct,
  fetchRelated,
  getImageUrl,
  imageFallbackHandler,
  isOnSale,
} from "../lib/catalog";
import { addRecentlyViewed } from "../lib/recentlyViewed";

interface Review {
  id: string | number;
  name: string;
  rating: number;
  date: string;
  comment: string;
  createdAt?: string;
  verified?: boolean;
}

type Breakdown = Record<1 | 2 | 3 | 4 | 5, number>;

const EMPTY_BREAKDOWN: Breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

function buildBreakdown(reviews: Review[]): Breakdown {
  const result = { ...EMPTY_BREAKDOWN };
  reviews.forEach((r) => {
    const key = Math.min(5, Math.max(1, Math.round(r.rating))) as keyof Breakdown;
    result[key] += 1;
  });
  return result;
}

/** "Mon, Nov 9" style date n business days from now. */
function businessDaysFromNow(days: number) {
  const date = new Date();
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added += 1;
  }
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function ProductDetails() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user, token } = useAuth();
  const { currentCurrency, formatPrice } = useCurrency();
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedColor, setSelectedColor] = useState<ProductColorVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [newReviewer, setNewReviewer] = useState(user?.name || "");
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewsOffline, setReviewsOffline] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;

    const load = async () => {
      setLoading(true);
      setNotFound(false);
      setQuantity(1);

      const loaded = await fetchProduct(id);
      if (!active) return;

      if (!loaded) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(loaded);
      setSelectedColor(loaded.colors?.[0] ?? null);
      setLoading(false);
      addRecentlyViewed(loaded);

      fetchRelated(loaded).then((list) => active && setRelated(list));

      try {
        const res = await fetch(`${API_BASE_URL}/api/products/${loaded.id}/reviews`);
        const data = await res.json();
        if (!active) return;
        if (res.ok && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
          setReviewsOffline(false);
        }
      } catch {
        if (!active) return;
        setReviewsOffline(true);
        try {
          const saved = localStorage.getItem(`nova_reviews_${loaded.id}`);
          setReviews(saved ? JSON.parse(saved) : []);
        } catch {
          setReviews([]);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const breakdown = useMemo(() => buildBreakdown(reviews), [reviews]);
  const averageRating = useMemo(
    () => (reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : product?.rating || 0),
    [reviews, product]
  );

  const sortedReviews = useMemo(() => {
    const list = [...reviews];
    if (reviewSort === "highest") list.sort((a, b) => b.rating - a.rating);
    if (reviewSort === "lowest") list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [reviews, reviewSort]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !product) return;

    const reviewerName = newReviewer.trim() || user?.name || "Verified Customer";
    setIsSubmittingReview(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: reviewerName, rating: newRating, comment: newComment.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.review) throw new Error(data.message || "Failed to submit review");

      setReviews((prev) => [data.review, ...prev]);
      if (typeof data.averageRating === "number") {
        setProduct((prev) => (prev ? { ...prev, rating: data.averageRating } : prev));
      }
      showToast("Thanks for your review! ⭐", "success");
    } catch (err) {
      if (err instanceof Error && err.message !== "Failed to fetch") {
        showToast(err.message, "error");
        setIsSubmittingReview(false);
        return;
      }
      // Backend offline: keep the review on this device so the demo still works.
      const review: Review = { id: Date.now(), name: reviewerName, rating: newRating, date: "Just now", comment: newComment.trim() };
      const updated = [review, ...reviews];
      setReviews(updated);
      try {
        localStorage.setItem(`nova_reviews_${product.id}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      showToast("Saved on this device (server offline)", "info");
    }

    setNewComment("");
    setNewRating(5);
    setIsSubmittingReview(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast("Link copied to clipboard 🔗", "success");
    } catch {
      // share sheet dismissed
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12 grid md:grid-cols-2 gap-12">
          <div className="aspect-square rounded-3xl bg-gray-100 shimmer-effect" />
          <div className="space-y-4 py-4">
            <div className="h-5 w-24 rounded-full bg-gray-100 shimmer-effect" />
            <div className="h-10 w-3/4 rounded-xl bg-gray-100 shimmer-effect" />
            <div className="h-8 w-40 rounded-xl bg-gray-100 shimmer-effect" />
            <div className="h-24 rounded-xl bg-gray-100 shimmer-effect" />
            <div className="h-14 rounded-full bg-gray-100 shimmer-effect" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center text-center px-5 py-32">
          <h1 className="text-3xl font-black">Product not found</h1>
          <p className="text-gray-500 mt-2">It may have been removed or the link is wrong.</p>
          <Link to="/products" className="mt-6 bg-black text-white px-6 py-3 rounded-full hover:bg-orange-500 transition">
            Browse all products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const hasSale = isOnSale(product);
  const discount = discountPercent(product);
  const effectiveStock =
    selectedColor && selectedColor.quantity !== undefined ? Number(selectedColor.quantity) : product.stock;
  const currentDisplayImage = selectedColor?.image || product.image;
  const maxBar = Math.max(1, ...Object.values(breakdown));

  const addSelected = () => {
    addToCart(product, selectedColor?.name, selectedColor?.image, quantity);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500 mb-8 flex-wrap">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <ChevronRight size={14} />
          <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-orange-500">
            {product.category}
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Gallery */}
          <div className="space-y-4 md:sticky md:top-28">
            <div
              className="bg-gray-50 rounded-3xl overflow-hidden border relative shadow-sm cursor-zoom-in"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setZoom({
                  x: ((e.clientX - rect.left) / rect.width) * 100,
                  y: ((e.clientY - rect.top) / rect.height) * 100,
                });
              }}
              onMouseLeave={() => setZoom(null)}
            >
              {hasSale && (
                <div className="absolute top-5 left-5 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                  <Flame size={14} className="fill-white" />
                  {discount}% OFF
                </div>
              )}

              {selectedColor && (
                <div className="absolute bottom-5 left-5 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 z-10">
                  <span className="w-3 h-3 rounded-full border border-white/60" style={{ backgroundColor: selectedColor.hex }} />
                  {selectedColor.name}
                </div>
              )}

              <img
                key={currentDisplayImage}
                src={getImageUrl(currentDisplayImage, product.category)}
                alt={`${product.name}${selectedColor ? ` - ${selectedColor.name}` : ""}`}
                onError={imageFallbackHandler(product.category)}
                className="w-full aspect-square object-cover transition-transform duration-200 ease-out animate-fade-in"
                style={
                  zoom
                    ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : { transform: "scale(1)" }
                }
              />

              <div className="absolute top-5 right-5 flex flex-col gap-2 z-10">
                <button
                  onClick={() => {
                    toggleWishlist(product);
                    showToast(!inWishlist ? "Saved to wishlist! ❤️" : "Removed from wishlist", !inWishlist ? "success" : "info");
                  }}
                  aria-label={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                  className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow text-gray-600 hover:text-red-500 transition"
                >
                  <Heart size={20} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
                </button>
                <button
                  onClick={handleShare}
                  aria-label="Share product"
                  className="bg-white/90 backdrop-blur-md p-3 rounded-full shadow text-gray-600 hover:text-orange-500 transition"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.colors.map((c) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        setQuantity(1);
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0 ${
                        isSelected
                          ? "border-orange-500 ring-2 ring-orange-500/30 scale-105"
                          : "border-gray-200 hover:border-gray-300 opacity-75 hover:opacity-100"
                      }`}
                      title={`${c.name} (${c.quantity} in stock)`}
                    >
                      <img
                        src={getImageUrl(c.image || product.image, product.category)}
                        onError={imageFallbackHandler(product.category)}
                        alt={c.name}
                        className="w-16 h-16 object-cover rounded-xl bg-gray-100"
                      />
                      <span
                        className="absolute bottom-2 right-2 w-3.5 h-3.5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: c.hex || "#000000" }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="py-2">
            <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">{product.name}</h1>

            {reviews.length > 0 ? (
              <a href="#reviews" className="flex items-center gap-2 mt-4 w-fit">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-900 ml-1">{averageRating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm underline-offset-2 hover:underline">
                  ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
                {(product.soldCount || 0) > 0 && (
                  <span className="text-xs text-gray-400">· {product.soldCount} sold</span>
                )}
              </a>
            ) : (
              <div className="flex items-center gap-2.5 mt-4">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">★ No reviews yet</span>
                <span className="text-xs text-gray-400">Be the first to review!</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3.5 mt-6">
              <span className="text-3xl md:text-4xl font-black text-gray-900">{formatPrice(product.price)}</span>
              {hasSale && (
                <>
                  <span className="text-xl text-gray-400 line-through font-semibold">{formatPrice(product.oldPrice)}</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    You save {formatPrice(product.oldPrice - product.price)}
                  </span>
                </>
              )}
            </div>
            {currentCurrency.code !== "USD" && (
              <p className="text-xs text-gray-400 mt-1">≈ ${product.price.toFixed(2)} USD</p>
            )}

            <p className="text-gray-600 leading-7 mt-6 text-sm border-t border-gray-100 pt-6">{product.description}</p>

            {/* Colours */}
            {product.colors && product.colors.length > 0 && (
              <div className="border-t border-gray-100 mt-6 pt-6">
                <h3 className="font-bold text-sm text-gray-900 mb-3">
                  Colour: <span className="text-orange-600 font-black">{selectedColor?.name || "Choose"}</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c) => {
                    const isSelected = selectedColor?.name === c.name;
                    const soldOut = Number(c.quantity) <= 0;
                    return (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c);
                          setQuantity(1);
                        }}
                        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/70 shadow-md"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        } ${soldOut ? "opacity-50" : ""}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-gray-300 shrink-0" style={{ backgroundColor: c.hex }} />
                        <span className="text-left">
                          <span className={`block text-xs font-bold ${isSelected ? "text-orange-900" : "text-gray-800"}`}>
                            {c.name}
                          </span>
                          <span className="block text-[10px] text-gray-400">{soldOut ? "Sold out" : `${c.quantity} in stock`}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mt-6">
              {effectiveStock <= 0 ? (
                <p className="text-sm font-bold text-red-500">Out of stock{selectedColor ? ` in ${selectedColor.name}` : ""}</p>
              ) : effectiveStock <= 5 ? (
                <div>
                  <p className="text-sm font-bold text-amber-600 flex items-center gap-1.5">
                    <Zap size={15} className="fill-amber-500" />
                    Hurry — only {effectiveStock} left{selectedColor ? ` in ${selectedColor.name}` : ""}
                  </p>
                  <div className="mt-2 h-1.5 w-48 rounded-full bg-amber-100 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(effectiveStock / 5) * 100}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-sm font-bold text-emerald-600">In stock — ready to ship</p>
              )}
            </div>

            {/* Quantity + actions */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center border rounded-full">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3.5 hover:bg-gray-100 rounded-full"
                >
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-bold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= effectiveStock}
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  className="p-3.5 hover:bg-gray-100 rounded-full disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={addSelected}
                disabled={effectiveStock <= 0}
                className="flex-1 min-w-48 bg-black text-white py-4 rounded-full flex items-center justify-center gap-2.5 hover:bg-orange-500 transition font-bold shadow-lg disabled:opacity-50"
              >
                <ShoppingCart size={19} />
                Add to Cart
              </button>
            </div>

            <button
              onClick={() => {
                addSelected();
                navigate("/checkout");
              }}
              disabled={effectiveStock <= 0}
              className="mt-3 w-full border-2 border-gray-900 py-3.5 rounded-full font-bold hover:bg-gray-900 hover:text-white transition disabled:opacity-40"
            >
              Buy it now
            </button>

            {/* Delivery & guarantees */}
            <div className="mt-8 rounded-2xl border border-gray-100 divide-y text-sm">
              <div className="flex items-start gap-3 p-4">
                <Truck size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Estimated delivery: {businessDaysFromNow(3)} – {businessDaysFromNow(5)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Free shipping on orders over {formatPrice(100)}.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <RotateCcw size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">30-day returns</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Changed your mind? <Link to="/faq" className="underline">See how returns work</Link>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <ShieldCheck size={20} className="text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">1-year warranty</p>
                  <p className="text-xs text-gray-500 mt-0.5">Covers manufacturing defects on every item.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section id="reviews" className="mt-20 border-t pt-16 scroll-mt-28">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
              <p className="text-xs text-gray-500">
                {reviewsOffline ? "Server offline — showing reviews saved on this device" : "Real feedback from shoppers"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12">
            {/* Summary + form */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-3xl border p-6">
                <div className="flex items-end gap-3">
                  <span className="text-5xl font-black">{averageRating ? averageRating.toFixed(1) : "–"}</span>
                  <div className="pb-1.5">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className={s <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{reviews.length} reviews</p>
                  </div>
                </div>
                <div className="mt-5 space-y-1.5">
                  {([5, 4, 3, 2, 1] as const).map((star) => (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-6 font-semibold text-gray-600">{star}★</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                          style={{ width: `${(breakdown[star] / maxBar) * 100}%` }}
                        />
                      </div>
                      <span className="w-5 text-right text-gray-500">{breakdown[star]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Write a review</h3>
                <form onSubmit={handleAddReview} className="space-y-4 text-sm">
                  <div>
                    <label htmlFor="review-name" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Your name
                    </label>
                    <input
                      id="review-name"
                      type="text"
                      placeholder="e.g. Usman Ali"
                      value={newReviewer}
                      onChange={(e) => setNewReviewer(e.target.value)}
                      required
                      maxLength={100}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-gray-700 uppercase mb-1">Rating</span>
                    <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                      {[1, 2, 3, 4, 5].map((num) => (
                        <button
                          type="button"
                          key={num}
                          onClick={() => setNewRating(num)}
                          onMouseEnter={() => setHoverRating(num)}
                          aria-label={`${num} star${num > 1 ? "s" : ""}`}
                          className="p-1"
                        >
                          <Star
                            size={26}
                            className={`transition ${(hoverRating || newRating) >= num ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-300"}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="review-comment" className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Your feedback
                    </label>
                    <textarea
                      id="review-comment"
                      rows={3}
                      placeholder="What did you like or dislike?"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      maxLength={1000}
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-orange-500 transition shadow disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Submitting…" : "Submit review"}
                  </button>
                  {!user && (
                    <p className="text-[11px] text-gray-400 text-center">
                      <Link to="/login" className="underline">Sign in</Link> to get a “Verified buyer” badge on items you've ordered.
                    </p>
                  )}
                </form>
              </div>
            </div>

            {/* List */}
            <div>
              {reviews.length > 1 && (
                <div className="flex justify-end mb-4">
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value as typeof reviewSort)}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                    aria-label="Sort reviews"
                  >
                    <option value="newest">Newest first</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </div>
              )}
              <div className="space-y-4">
                {sortedReviews.length === 0 ? (
                  <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/60">
                    <h4 className="font-black text-gray-900">No reviews yet</h4>
                    <p className="text-xs text-gray-500 mt-1">Be the first to share your experience.</p>
                  </div>
                ) : (
                  sortedReviews.map((rev) => (
                    <article key={rev.id} className="bg-gray-50 p-6 rounded-2xl border space-y-3 animate-fade-in">
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow">
                            {rev.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                              {rev.name}
                              {rev.verified && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                  <BadgeCheck size={11} /> Verified buyer
                                </span>
                              )}
                            </h4>
                            <span className="text-xs text-gray-400">{rev.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={14} className={s <= rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">{rev.comment}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20 border-t pt-16">
            <div className="flex items-end justify-between mb-8">
              <h2 className="text-2xl font-black">You may also like</h2>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1">
                More in {product.category} <ArrowLeft size={14} className="rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>

      <RecentlyViewed key={product.id} excludeId={product.id} />

      <Footer />
    </div>
  );
}

export default ProductDetails;
