import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const {
    items,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    subtotal,
    shipping,
    total,
  } = useCart();

  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#f5f2ed] py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <h1 className="text-4xl font-black">Shopping Cart</h1>
          <p className="text-gray-600 mt-3">
            Review your selected products before proceeding to checkout.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={38} className="text-gray-400" />
            </div>

            <h2 className="text-2xl font-bold mt-6">Your Cart is Empty</h2>

            <p className="text-gray-500 mt-3">
              Looks like you haven't added anything yet.
            </p>

            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-7 bg-black text-white px-7 py-4 rounded-full hover:bg-orange-500 transition"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-10">
            {/* Cart Items */}
            <div>
              <div className="hidden md:grid grid-cols-[1fr_130px_130px_80px] gap-4 border-b pb-4 text-sm font-semibold text-gray-500">
                <span>PRODUCT</span>
                <span>PRICE</span>
                <span>QUANTITY</span>
                <span>TOTAL</span>
              </div>

              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_80px] gap-5 items-center py-6"
                  >
                    {/* Product */}
                    <div className="flex gap-4 items-center">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-24 h-28 object-cover rounded-xl bg-gray-100"
                      />

                      <div>
                        <p className="text-xs text-gray-500">
                          {item.product.category}
                        </p>

                        <h3 className="font-semibold mt-1">
                          {item.product.name}
                        </h3>

                        <p className="text-sm text-gray-500 mt-2">In Stock</p>

                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="flex items-center gap-1 text-red-500 text-sm mt-3 hover:text-red-700"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="font-semibold">
                      <span className="md:hidden text-gray-500 font-normal">
                        Price:{" "}
                      </span>
                      ${item.product.price.toFixed(2)}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center border rounded-xl w-fit">
                      <button
                        onClick={() => decreaseQuantity(item.product.id)}
                        aria-label="Decrease quantity"
                        className="p-3 hover:bg-gray-100"
                      >
                        <Minus size={15} />
                      </button>

                      <span className="px-3 font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => increaseQuantity(item.product.id)}
                        disabled={item.quantity >= item.product.stock}
                        aria-label="Increase quantity"
                        className="p-3 hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="font-bold">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-orange-500 mt-5"
              >
                <ArrowLeft size={17} />
                Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <aside className="bg-gray-50 rounded-2xl p-6 h-fit border">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>

                <div className="border-t pt-4 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">${total.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-5">
                {subtotal >= 100
                  ? "Congratulations! You qualify for free shipping."
                  : `Add $${(100 - subtotal).toFixed(2)} more to get free shipping.`}
              </p>

              <Link
                to={isAuthenticated ? "/checkout" : "/login"}
                className="w-full bg-black text-white py-4 rounded-full mt-6 hover:bg-orange-500 transition font-semibold flex items-center justify-center gap-2"
              >
                Proceed to Checkout
                <ArrowRight size={18} />
              </Link>

              <p className="text-xs text-center text-gray-500 mt-4">
                Secure checkout experience • Direct order processing
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Cart;