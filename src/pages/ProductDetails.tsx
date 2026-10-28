import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  MessageSquare,
  ThumbsUp,
  Heart,
  Flame,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { API_BASE_URL } from "../config/api";
import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const CATEGORY_FALLBACKS: Record<string, string> = {
  Fashion: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
  Electronics: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  Accessories: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
};

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=600&q=80";

function getFallbackImage(category?: string): string {
  return (category && CATEGORY_FALLBACKS[category]) || DEFAULT_FALLBACK;
}

function getImageUrl(imagePath?: string, category?: string): string {
  if (!imagePath || imagePath.includes("via.placeholder.com")) {
    return getFallbackImage(category);
  }
  if (imagePath.startsWith("https://images.unsplash.com/photo-") && !imagePath.includes("?")) {
    return `${imagePath}?auto=format&fit=crop&w=600&q=80`;
  }
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

interface Review {
  id: string | number;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: "1",
    name: "Ahmad Hassan",
    rating: 5,
    date: "2 days ago",
    comment: "Outstanding build quality and fast shipping! Exceeded my expectations.",
  },
  {
    id: "2",
    name: "Sara Khan",
    rating: 4,
    date: "1 week ago",
    comment: "Very comfortable and durable material. Highly recommended for daily use.",
  },
];

function ProductDetails() {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user, token } = useAuth();
  const { id } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColorVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReviewer, setNewReviewer] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Auto-fill reviewer name if logged in
  useEffect(() => {
    if (user?.name && !newReviewer) {
      setNewReviewer(user.name);
    }
  }, [user, newReviewer]);

  // Fetch reviews from backend API
  const fetchReviews = async (productId: string | number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${productId}/reviews`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        return typeof data.averageRating === "number" ? data.averageRating : null;
      }
    } catch {
      // Local fallback
      const savedKey = `nova_reviews_${productId}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setReviews(parsed);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const avg = parsed.reduce((sum: number, r: Review) => sum + r.rating, 0) / parsed.length;
            return Number(avg.toFixed(1));
          }
        } catch {
          setReviews([]);
        }
      } else if (Number(productId) <= 2) {
        setReviews(INITIAL_REVIEWS);
      } else {
        setReviews([]);
      }
    }
    return null;
  };

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setApiError("");

        const [productRes, avgRatingFromApi] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/${id}`),
          fetchReviews(id),
        ]);

        const data = await productRes.json();
        if (!productRes.ok || !data.product) {
          throw new Error(data.message || "Product not found");
        }

        const p = data.product;
        const colorsArr = Array.isArray(p.colors) ? p.colors : [];
        const calculatedRating = avgRatingFromApi !== null ? avgRatingFromApi : Number(p.rating) || 0;

        setProduct({
          ...p,
          id: Number(p.id),
          price: Number(p.price) || 0,
          oldPrice: Number(p.oldPrice) || 0,
          rating: calculatedRating,
          stock: Number(p.stock) || 0,
          colors: colorsArr,
        });

        if (colorsArr.length > 0) {
          setSelectedColor(colorsArr[0]);
        } else {
          setSelectedColor(null);
        }
      } catch (err: any) {
        console.error("Product fetch error:", err);
        setApiError(err.message || "Unable to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    const reviewerName = newReviewer.trim() || user?.name || "Verified Customer";
    setIsSubmittingReview(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: reviewerName,
          rating: newRating,
          comment: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        if (data.averageRating !== undefined) {
          setProduct((prev) => (prev ? { ...prev, rating: data.averageRating } : null));
        }
        showToast("Review submitted successfully! ⭐", "success");
        setNewComment("");
        setNewRating(5);
        return;
      }
      throw new Error(data.message || "Failed to submit review");
    } catch (err: any) {
      console.warn("Backend review submission error, saving to local cache:", err);
      const review: Review = {
        id: Date.now().toString(),
        name: reviewerName,
        rating: newRating,
        date: "Just now",
        comment: newComment.trim(),
      };

      const updated = [review, ...reviews];
      setReviews(updated);
      localStorage.setItem(`nova_reviews_${id}`, JSON.stringify(updated));

      const avg = updated.reduce((acc, r) => acc + r.rating, 0) / updated.length;
      setProduct((prev) => (prev ? { ...prev, rating: Number(avg.toFixed(1)) } : null));

      showToast("Review submitted successfully! ⭐", "success");
      setNewComment("");
      setNewRating(5);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-32">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500" />
          <p className="mt-4 text-gray-500">Loading product details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (apiError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-5">
        <h1 className="text-3xl font-bold">Product Not Found</h1>
        <p className="text-gray-500 mt-2">{apiError || "Product does not exist."}</p>
        <Link to="/products" className="mt-5 bg-black text-white px-6 py-3 rounded-full">
          Back to Products
        </Link>
      </div>
    );
  }

  const fallback = getFallbackImage(product.category);
  const inWishlist = isInWishlist(product.id);

  const priceNum = Number(product.price) || 0;
  const oldPriceNum = Number(product.oldPrice) || 0;
  const hasSale = Boolean(oldPriceNum > priceNum && priceNum > 0);
  const discountPercent = hasSale
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;
  const savingsAmount = hasSale ? (oldPriceNum - priceNum).toFixed(2) : "0.00";

  const effectiveStock =
    selectedColor && selectedColor.quantity !== undefined
      ? Number(selectedColor.quantity)
      : Number(product.stock) || 0;

  const currentDisplayImage = selectedColor?.image || product.image;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        <Link
          to="/products"
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8 font-medium"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Product Image & Color Thumbnails */}
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-3xl overflow-hidden border relative group shadow-sm">
              {hasSale && (
                <div className="absolute top-5 left-5 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 z-10">
                  <Flame size={14} className="fill-white" />
                  ON SALE · {discountPercent}% OFF
                </div>
              )}

              {/* Color Name Tag on Image */}
              {selectedColor && (
                <div className="absolute bottom-5 left-5 bg-black/75 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 z-10">
                  <span
                    className="w-3 h-3 rounded-full border border-white/60"
                    style={{ backgroundColor: selectedColor.hex || "#000000" }}
                  />
                  <span>Color: {selectedColor.name}</span>
                </div>
              )}

              <img
                key={currentDisplayImage}
                src={getImageUrl(currentDisplayImage, product.category)}
                alt={`${product.name} ${selectedColor ? `- ${selectedColor.name}` : ""}`}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
                className="w-full h-112.5 md:h-150 object-cover transition-all duration-300"
              />

              <button
                onClick={() => {
                  toggleWishlist(product);
                  showToast(
                    !inWishlist ? "Saved to wishlist! ❤️" : "Removed from wishlist",
                    !inWishlist ? "success" : "info"
                  );
                }}
                className="absolute top-5 right-5 bg-white/90 backdrop-blur-md p-3 rounded-full shadow text-gray-600 hover:text-red-500 transition z-10"
              >
                <Heart size={20} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
              </button>
            </div>

            {/* Color Gallery Thumbnails */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {product.colors.map((c, i) => {
                  const isSelected = selectedColor?.name === c.name;
                  return (
                    <button
                      key={i}
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

          {/* Product Information */}
          <div className="py-2">
            <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">
              {product.name}
            </h1>

            {reviews.length > 0 && product.rating && Number(product.rating) > 0 ? (
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        star <= Math.round(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-200"
                      }
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-900 ml-1">
                  {Number(product.rating).toFixed(1)}
                </span>
                <span className="text-gray-400 text-sm">
                  ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 mt-4">
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  ★ No reviews yet
                </span>
                <span className="text-xs text-gray-400">Be the first to review!</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3.5 mt-6">
              <span className="text-3xl md:text-4xl font-black text-gray-900">
                ${priceNum.toFixed(2)}
              </span>
              {hasSale && (
                <>
                  <span className="text-xl text-gray-400 line-through font-semibold">
                    ${oldPriceNum.toFixed(2)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-black text-white bg-rose-600 px-3 py-1 rounded-full shadow-sm">
                    <Flame size={13} className="fill-white" />
                    {discountPercent}% OFF SALE
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    You save ${savingsAmount}
                  </span>
                </>
              )}
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="font-bold text-base text-gray-900">Description</h3>
              <p className="text-gray-600 leading-7 mt-2 text-sm">
                {product.description}
              </p>
            </div>

            {/* Interactive Color Variant Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="border-t border-gray-100 mt-6 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                    <span>Available Colors:</span>
                    <span className="text-orange-600 font-black">
                      {selectedColor?.name || "Choose Color"}
                    </span>
                  </h3>
                  {selectedColor && (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        Number(selectedColor.quantity) > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {Number(selectedColor.quantity) > 0
                        ? `${selectedColor.quantity} units in stock`
                        : "Out of Stock"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c, i) => {
                    const isSelected = selectedColor?.name === c.name;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedColor(c);
                          setQuantity(1);
                        }}
                        className={`group flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/70 shadow-md ring-2 ring-orange-500/20"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-gray-300 shadow-xs shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: c.hex || "#000000" }}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                          )}
                        </span>
                        <div className="text-left">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? "text-orange-900" : "text-gray-800"}`}>
                            {c.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {Number(c.quantity) > 0 ? `${c.quantity} in stock` : "0 left"}
                          </p>
                        </div>
                        {c.image && (
                          <img
                            src={getImageUrl(c.image, product.category)}
                            alt={c.name}
                            className="w-7 h-7 rounded-lg object-cover border border-gray-200 bg-gray-100 ml-1 shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Availability */}
            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Availability:{" "}
                <span className={effectiveStock > 0 ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                  {effectiveStock > 0
                    ? `In Stock (${effectiveStock} left${selectedColor ? ` in ${selectedColor.name}` : ""})`
                    : `Out of Stock${selectedColor ? ` in ${selectedColor.name}` : ""}`}
                </span>
              </p>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <p className="font-semibold text-sm mb-2">Quantity</p>
              <div className="flex items-center border rounded-xl w-fit">
                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 font-bold">{quantity}</span>
                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= effectiveStock}
                  onClick={() =>
                    setQuantity((q) => Math.min(effectiveStock, q + 1))
                  }
                  className="p-3 hover:bg-gray-100 disabled:opacity-40"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                for (let i = 0; i < quantity; i++) {
                  addToCart(product, selectedColor?.name, selectedColor?.image);
                }
                showToast(`${product.name}${selectedColor ? ` (${selectedColor.name})` : ""} added to cart! 🛒`, "success");
              }}
              disabled={effectiveStock <= 0}
              className="mt-8 w-full bg-black text-white py-4 rounded-full flex items-center justify-center gap-3 hover:bg-orange-500 transition font-bold shadow-lg disabled:opacity-50"
            >
              <ShoppingCart size={19} />
              Add to Cart
            </button>

            <p className="text-center text-gray-400 text-xs mt-4">
              Secure shopping • Quality guaranteed • 30-day return policy
            </p>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-20 border-t pt-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
              <MessageSquare size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Reviews & Ratings
              </h2>
              <p className="text-xs text-gray-500">
                Real feedback from verified customers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
            {/* Reviews List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50/60 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                    <MessageSquare size={22} />
                  </div>
                  <h4 className="font-black text-gray-900 text-base">No reviews yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
                    This product doesn't have any customer reviews yet. Be the first to share your experience by submitting a review!
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-gray-50 p-6 rounded-2xl border space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-sm shadow">
                          {rev.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{rev.name}</h4>
                          <span className="text-xs text-gray-400">{rev.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={
                              s <= rev.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{rev.comment}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                      <ThumbsUp size={13} />
                      Helpful
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Write a Review Form */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm h-fit">
              <h3 className="font-bold text-lg text-gray-900 mb-4">
                Write a Customer Review
              </h3>

              <form onSubmit={handleAddReview} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Usman Ali"
                    value={newReviewer}
                    onChange={(e) => setNewReviewer(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setNewRating(num)}
                        className={`p-2 rounded-xl border flex items-center justify-center transition ${
                          newRating === num
                            ? "border-yellow-500 bg-yellow-50 text-yellow-600 font-bold"
                            : "border-gray-200 text-gray-400"
                        }`}
                      >
                        <Star size={16} className={newRating >= num ? "fill-yellow-400 text-yellow-400" : ""} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Your Feedback
                  </label>
                  <textarea
                    rows={3}
                    placeholder="What did you like or dislike about this product?"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-orange-500 transition shadow disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingReview ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}

export default ProductDetails;