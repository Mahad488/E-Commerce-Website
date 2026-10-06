import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";

import { API_BASE_URL } from "../config/api";

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

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();

  const fallback = getFallbackImage(product.category);
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    showToast(`${product.name} added to cart! 🛒`, "success");
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    if (!inWishlist) {
      showToast(`${product.name} saved to wishlist! ❤️`, "success");
    } else {
      showToast(`Removed from wishlist`, "info");
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 group">
      <div className="relative overflow-hidden">
        <Link to={`/products/${product.id}`}>
          <img
            src={getImageUrl(product.image, product.category)}
            alt={product.name}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
            className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
          />
        </Link>

        <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow">
          SALE
        </span>

        <button
          onClick={handleToggleWishlist}
          aria-label="Add to wishlist"
          className={`absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow transition ${
            inWishlist ? "text-red-500 fill-red-500" : "text-gray-600 hover:text-red-500"
          }`}
        >
          <Heart size={18} className={inWishlist ? "fill-red-500 text-red-500" : ""} />
        </button>

        <button
          onClick={handleAddToCart}
          className="absolute bottom-4 left-4 right-4 bg-black text-white py-3 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition shadow-lg"
        >
          <ShoppingCart size={17} />
          Add to Cart
        </button>
      </div>

      <div className="p-5">
        <p className="text-xs text-gray-500 font-medium">{product.category}</p>

        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold mt-2 hover:text-orange-500 transition line-clamp-1">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2">
          <Star size={15} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600 font-medium">
            {product.rating}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="font-bold text-lg text-gray-900">
            ${Number(product.price || 0).toFixed(2)}
          </span>

          {product.oldPrice !== undefined && product.oldPrice !== null && (
            <span className="text-sm text-gray-400 line-through">
              ${Number(product.oldPrice || 0).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductCard;