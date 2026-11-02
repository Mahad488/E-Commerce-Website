import { Heart, ShoppingCart, Star, Flame, Eye } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { Product, ProductColorVariant } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useCurrency } from "../context/CurrencyContext";
import { discountPercent, getImageUrl, imageFallbackHandler, isOnSale } from "../lib/catalog";
import QuickViewModal from "./QuickViewModal";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { currentCurrency, formatPrice } = useCurrency();
  const [heartPopping, setHeartPopping] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [cardSelectedColor, setCardSelectedColor] = useState<ProductColorVariant | null>(
    product.colors && product.colors.length > 0 ? product.colors[0] : null
  );

  const inWishlist = isInWishlist(product.id);
  const priceNum = Number(product.price) || 0;
  const oldPriceNum = Number(product.oldPrice) || 0;
  const hasSale = isOnSale(product);
  const discount = discountPercent(product);
  const isBestSeller = (product.soldCount || 0) >= 3;
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 5;

  const currentImage = cardSelectedColor?.image || product.image;

  const handleAddToCart = () => {
    addToCart(product, cardSelectedColor?.name, cardSelectedColor?.image);
  };

  const handleToggleWishlist = () => {
    setHeartPopping(true);
    setTimeout(() => setHeartPopping(false), 500);

    toggleWishlist(product);
    showToast(inWishlist ? "Removed from wishlist" : `${product.name} saved to wishlist! ❤️`, inWishlist ? "info" : "success");
  };

  return (
    <>
      <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-orange-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
        {/* Image & badges */}
        <div className="relative overflow-hidden bg-gray-50 aspect-square">
          <Link to={`/products/${product.id}`} className="block w-full h-full">
            <img
              key={currentImage}
              src={getImageUrl(currentImage, product.category)}
              alt={product.name}
              loading="lazy"
              onError={imageFallbackHandler(product.category)}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 ${
                outOfStock ? "grayscale opacity-70" : ""
              }`}
            />
          </Link>

          <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 pointer-events-none z-10">
            {hasSale ? (
              <span className="shimmer-effect bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
                <Flame size={12} className="fill-white" />
                {discount}% OFF
              </span>
            ) : Number(product.rating) === 0 ? (
              <span className="bg-gray-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                NEW
              </span>
            ) : null}
            {isBestSeller && (
              <span className="bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                Bestseller
              </span>
            )}
          </div>

          {outOfStock && (
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 mx-auto w-fit bg-white/95 text-gray-900 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow pointer-events-none">
              Sold out
            </span>
          )}

          {/* Wishlist + quick view */}
          <div className="absolute top-3.5 right-3.5 flex flex-col gap-2 z-10">
            <button
              onClick={handleToggleWishlist}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              className={`bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md transition-all duration-200 hover:scale-110 active:scale-90 ${
                inWishlist ? "text-rose-500 hover:bg-rose-50" : "text-gray-600 hover:text-rose-500 hover:bg-white"
              } ${heartPopping ? "animate-heart-pop" : ""}`}
            >
              <Heart size={18} className={`transition-colors duration-200 ${inWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            <button
              onClick={() => setQuickViewOpen(true)}
              aria-label={`Quick view ${product.name}`}
              className="bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow-md text-gray-600 hover:text-orange-600 hover:scale-110 transition-all duration-200 lg:opacity-0 lg:translate-x-3 group-hover:opacity-100 group-hover:translate-x-0"
            >
              <Eye size={18} />
            </button>
          </div>

          {/* Quick add (slides up on hover) */}
          {!outOfStock && (
            <div className="absolute inset-x-3.5 bottom-3.5 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none z-10">
              <button
                onClick={handleAddToCart}
                className="pointer-events-auto w-full bg-gray-950/95 hover:bg-orange-600 backdrop-blur-md text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold shadow-xl active:scale-95 transition-all duration-200"
              >
                <ShoppingCart size={15} />
                Quick Add to Cart
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>{product.category}</span>
              {product.rating && Number(product.rating) > 0 ? (
                <div className="flex items-center gap-1 text-amber-500 font-semibold">
                  <Star size={13} className="fill-amber-400 text-amber-400" />
                  <span>{Number(product.rating).toFixed(1)}</span>
                  {product.reviewCount ? <span className="text-gray-400 font-normal">({product.reviewCount})</span> : null}
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">No reviews yet</span>
              )}
            </div>

            <Link to={`/products/${product.id}`}>
              <h3 className="font-bold text-gray-900 mt-2 text-sm sm:text-base group-hover:text-orange-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
            </Link>

            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2.5">
                {product.colors.slice(0, 4).map((c) => {
                  const isSelected = cardSelectedColor?.name === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCardSelectedColor(c);
                      }}
                      onMouseEnter={() => setCardSelectedColor(c)}
                      title={`${c.name} (${Number(c.quantity) || 0} in stock)`}
                      aria-label={`Colour ${c.name}`}
                      className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                        isSelected ? "ring-2 ring-orange-500 scale-125 border-white shadow-xs" : "border-gray-200 hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.hex || "#000000" }}
                    />
                  );
                })}
                {product.colors.length > 4 && (
                  <span className="text-[10px] text-gray-400 font-bold ml-0.5">+{product.colors.length - 4}</span>
                )}
                {cardSelectedColor && (
                  <span className="text-[10px] font-bold text-orange-600 ml-1.5 truncate max-w-25">{cardSelectedColor.name}</span>
                )}
              </div>
            )}

            {lowStock && (
              <p className="text-[11px] font-bold text-amber-600 mt-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Only {product.stock} left
              </p>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-black text-lg text-gray-900">{formatPrice(priceNum)}</span>
                {hasSale && <span className="text-xs text-gray-400 line-through font-medium">{formatPrice(oldPriceNum)}</span>}
              </div>
              {currentCurrency.code !== "USD" && (
                <span className="text-[10px] text-gray-400 font-medium block">≈ ${priceNum.toFixed(2)} USD</span>
              )}
            </div>

            {hasSale && (
              <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80">
                Save {formatPrice(oldPriceNum - priceNum)}
              </span>
            )}
          </div>
        </div>
      </div>

      {quickViewOpen && <QuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />}
    </>
  );
}
