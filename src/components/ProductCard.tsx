import { Heart, ShoppingCart, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../data/products";

interface ProductCardProps {
  product: Product;
}

function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 group">

      <div className="relative overflow-hidden">

        <Link to={`/products/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition duration-500"
          />
        </Link>

        <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full">
          SALE
        </span>

        <button
          aria-label="Add to wishlist"
          className="absolute top-4 right-4 bg-white p-2.5 rounded-full shadow hover:text-red-500"
        >
          <Heart size={18} />
        </button>

        <Link
          to={`/products/${product.id}`}
          className="absolute bottom-4 left-4 right-4 bg-black text-white py-3 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition"
        >
          <ShoppingCart size={17} />
          View Product
        </Link>

      </div>

      <div className="p-5">

        <p className="text-xs text-gray-500">
          {product.category}
        </p>

        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold mt-2 hover:text-orange-500 transition">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2">
          <Star size={15} className="fill-yellow-400 text-yellow-400" />
          <span className="text-sm text-gray-600">
            {product.rating}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <span className="font-bold text-lg">
            ${product.price.toFixed(2)}
          </span>

          <span className="text-sm text-gray-400 line-through">
            ${product.oldPrice.toFixed(2)}
          </span>
        </div>

      </div>
    </div>
  );
}

export default ProductCard;