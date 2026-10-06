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
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { API_BASE_URL } from "../config/api";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";

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
  id: string;
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
  const { id } = useParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [newReviewer, setNewReviewer] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setApiError("");

        const response = await fetch(`${API_BASE_URL}/api/products/${id}`);
        const data = await response.json();

        if (!response.ok || !data.product) {
          throw new Error(data.message || "Product not found");
        }

        const p = data.product;
        setProduct({
          ...p,
          id: Number(p.id),
          price: Number(p.price) || 0,
          oldPrice: Number(p.oldPrice) || 0,
          rating: Number(p.rating) || 0,
          stock: Number(p.stock) || 0,
        });
      } catch (err: any) {
        console.error("Product fetch error:", err);
        setApiError(err.message || "Unable to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewer.trim() || !newComment.trim()) return;

    const review: Review = {
      id: Date.now().toString(),
      name: newReviewer.trim(),
      rating: newRating,
      date: "Just now",
      comment: newComment.trim(),
    };

    setReviews([review, ...reviews]);
    setNewReviewer("");
    setNewComment("");
    setNewRating(5);
    showToast("Review submitted successfully! ⭐", "success");
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
          {/* Product Image */}
          <div className="bg-gray-50 rounded-3xl overflow-hidden border relative">
            <img
              src={getImageUrl(product.image, product.category)}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== fallback) {
                  target.src = fallback;
                }
              }}
              className="w-full h-112.5 md:h-150 object-cover"
            />
            <button
              onClick={() => {
                toggleWishlist(product);
                showToast(
                  !inWishlist ? "Saved to wishlist! ❤️" : "Removed from wishlist",
                  !inWishlist ? "success" : "info"
                );
              }}
              className="absolute top-5 right-5 bg-white/90 backdrop-blur-md p-3 rounded-full shadow text-gray-600 hover:text-red-500 transition"
            >
              <Heart size={20} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {/* Product Information */}
          <div className="py-2">
            <span className="text-orange-500 text-xs font-extrabold uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mt-4">
              {product.name}
            </h1>

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
              <span className="font-bold text-gray-900 ml-1">{product.rating}</span>
              <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <span className="text-3xl font-black text-gray-900">
                ${Number(product.price || 0).toFixed(2)}
              </span>
              {product.oldPrice !== undefined && product.oldPrice !== null && (
                <span className="text-lg text-gray-400 line-through">
                  ${Number(product.oldPrice || 0).toFixed(2)}
                </span>
              )}
            </div>

            <div className="border-t border-gray-100 mt-6 pt-6">
              <h3 className="font-bold text-base text-gray-900">Description</h3>
              <p className="text-gray-600 leading-7 mt-2 text-sm">
                {product.description}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600">
                Availability:{" "}
                <span className="text-green-600 font-bold">
                  {product.stock > 0 ? `In Stock (${product.stock} left)` : "Out of Stock"}
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
                  disabled={quantity >= product.stock}
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
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
                  addToCart(product);
                }
                showToast(`${product.name} added to cart! 🛒`, "success");
              }}
              disabled={product.stock === 0}
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
              {reviews.map((rev) => (
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
              ))}
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
                  className="w-full bg-black text-white py-3 rounded-full font-bold text-sm hover:bg-orange-500 transition shadow"
                >
                  Submit Review
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