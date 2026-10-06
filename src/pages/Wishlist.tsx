import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = (product: any) => {
    addToCart(product);
    removeFromWishlist(product.id);
    showToast(`${product.name} moved to cart! 🛒`, "success");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#f5f2ed] py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-600 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Heart size={14} className="fill-red-600" />
            Favorites
          </div>
          <h1 className="text-4xl font-black text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-2">
            Items you have saved for later ({wishlist.length} saved).
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border">
            <div className="bg-red-100 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Heart size={36} />
            </div>

            <h2 className="text-2xl font-bold mt-6">Your Wishlist is Empty</h2>
            <p className="text-gray-500 mt-2">
              Explore our collection and tap the heart icon on items you love.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-6 bg-black text-white px-8 py-3.5 rounded-full hover:bg-orange-500 transition font-semibold"
            >
              <ArrowLeft size={16} />
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative overflow-hidden">
                    <Link to={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-64 object-cover hover:scale-105 transition duration-500"
                      />
                    </Link>

                    <button
                      onClick={() => {
                        removeFromWishlist(product.id);
                        showToast(`Removed from wishlist`, "info");
                      }}
                      className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2.5 rounded-full shadow text-red-500 hover:bg-red-50 transition"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-gray-500">{product.category}</p>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-semibold mt-1 hover:text-orange-500 transition line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-2 font-bold text-gray-900">
                      ${Number(product.price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="w-full bg-black text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-orange-500 transition"
                  >
                    <ShoppingCart size={16} />
                    Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
