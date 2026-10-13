import { Heart, ShoppingCart, Star, Flame } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product, ProductColorVariant } from "../data/products";
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

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const [heartPopping, setHeartPopping] = useState(false);
  const [cardSelectedColor, setCardSelectedColor] = useState<ProductColorVariant | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );

  const fallback = getFallbackImage(product.category);
  const inWishlist = isInWishlist(product.id);

  const priceNum = Number(product.price) || 0;
  const oldPriceNum = Number(product.oldPrice) || 0;
  const hasSale = Boolean(oldPriceNum > priceNum && priceNum > 0);
  const discountPercent = hasSale
    ? Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100)
    : 0;
  const savingsAmount = hasSale ? (oldPriceNum - priceNum).toFixed(2) : "0.00";

  const currentImage = cardSelectedColor?.image || product.image;

  const handleAddToCart = () => {
    addToCart(product, cardSelectedColor?.name, cardSelectedColor?.image);
    showToast(
      `${product.name}${cardSelectedColor ? ` (${cardSelectedColor.name})` : ""} added to cart! 🛒`,
      "success"
    );
  };

  const handleToggleWishlist = () => {
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 500);

    toggleWishlist(product);
    if (!inWishlist) {
      showToast(`${product.name} saved to wishlist! ❤️`, "success");
    } else {
      showToast(`Removed from wishlist`, "info");
    }
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-orange-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
      
      {/* Product Image & Badges Container */}
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <Link to={`/products/${product.id}`} className="block w-full h-full">
          <img
            key={currentImage}
            src={getImageUrl(currentImage, product.category)}
            alt={product.name}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== fallback) {
                target.src = fallback;
              }
            }}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          />
        </Link>

        {/* Dynamic SALE / NEW Badge */}
        {hasSale ? (
          <span className="shimmer-effect absolute top-3.5 left-3.5 bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 pointer-events-none z-10">
            <Flame size={12} className="fill-white" />
            {discountPercent}% OFF
          </span>
        ) : Number(product.rating) === 0 ? (
          <span className="absolute top-3.5 left-3.5 bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm pointer-events-none z-10">
            NEW
          </span>
        ) : null}

        {/* Animated Wishlist Button with Heart Pop */}
        <button
          onClick={handleToggleWishlist}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-3.5 right-3.5 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-90 z-10 ${
            inWishlist
              ? "text-rose-500 hover:bg-rose-50"
              : "text-gray-600 hover:text-rose-500 hover:bg-white"
          } ${heartPopping ? "animate-heart-pop" : ""}`}
        >
          <Heart
            size={18}
            className={`transition-colors duration-200 ${
              inWishlist ? "fill-rose-500 text-rose-500" : ""
            }`}
          />
        </button>

        {/* Quick Add to Cart Button (Smooth Slide-Up on hover) */}
        <div className="absolute inset-x-3.5 bottom-3.5 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none z-10">
          <button
            onClick={handleAddToCart}
            className="pointer-events-auto w-full bg-gray-950/95 hover:bg-orange-600 backdrop-blur-md text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-xl active:scale-95 transition-all duration-200"
          >
            <ShoppingCart size={15} />
            Quick Add to Cart
          </button>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>{product.category}</span>
            {product.rating && Number(product.rating) > 0 ? (
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{Number(product.rating).toFixed(1)}</span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                No reviews yet
              </span>
            )}
          </div>

          <Link to={`/products/${product.id}`}>
            <h3 className="font-bold text-gray-900 mt-2 text-sm sm:text-base group-hover:text-orange-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          {/* Interactive Color Variant Dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {product.colors.slice(0, 4).map((c, idx) => {
                const isSelected = cardSelectedColor?.name === c.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCardSelectedColor(c);
                    }}
                    onMouseEnter={() => setCardSelectedColor(c)}
                    title={`${c.name} (${Number(c.quantity) || 0} in stock)`}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-orange-500 scale-125 border-white shadow-xs"
                        : "border-gray-200 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex || "#000000" }}
                  />
                );
              })}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-gray-400 font-bold ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
              {cardSelectedColor && (
                <span className="text-[10px] font-bold text-orange-600 ml-1.5 truncate max-w-25">
                  {cardSelectedColor.name}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="font-black text-lg text-gray-900">
              ${priceNum.toFixed(2)}
            </span>

            {hasSale && (
              <span className="text-xs text-gray-400 line-through font-medium">
                ${oldPriceNum.toFixed(2)}
              </span>
            )}
          </div>

          {hasSale && (
            <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
              Save ${savingsAmount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}