import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, Truck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CouponBox from "../components/CouponBox";

import { FREE_SHIPPING_THRESHOLD, useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { getImageUrl, imageFallbackHandler } from "../lib/catalog";

function Cart() {
  const {
    items,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    maxQuantityFor,
    subtotal,
    discount,
    shipping,
    total,
    amountToFreeShipping,
  } = useCart();

  const { isAuthenticated } = useAuth();
  const { currentCurrency, formatPrice } = useCurrency();
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="bg-[#f5f2ed] py-12">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <h1 className="text-4xl font-black">Shopping Cart</h1>
          <p className="text-gray-600 mt-3">Review your selected products before proceeding to checkout.</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-12">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag size={38} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mt-6">Your Cart is Empty</h2>
            <p className="text-gray-500 mt-3">Looks like you haven't added anything yet.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 mt-7 bg-black text-white px-7 py-4 rounded-full hover:bg-orange-500 transition"
            >
              <ArrowLeft size={18} />
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-10">
            <div>
              {/* Free shipping progress */}
              <div className="mb-6 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Truck size={17} className="text-orange-500" />
                  {amountToFreeShipping > 0 ? (
                    <span>
                      You're <strong className="text-orange-600">{formatPrice(amountToFreeShipping)}</strong> away from free
                      shipping
                    </span>
                  ) : (
                    <span className="text-emerald-700">Free shipping unlocked 🎉</span>
                  )}
                </p>
                <div className="mt-2.5 h-2 rounded-full bg-orange-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${amountToFreeShipping > 0 ? progress : 100}%` }}
                  />
                </div>
              </div>

              <div className="hidden md:grid grid-cols-[1fr_130px_130px_90px] gap-4 border-b pb-4 text-sm font-semibold text-gray-500">
                <span>PRODUCT</span>
                <span>PRICE</span>
                <span>QUANTITY</span>
                <span>TOTAL</span>
              </div>

              <div className="divide-y">
                {items.map((item) => {
                  const max = maxQuantityFor(item);
                  return (
                    <div
                      key={`${item.product.id}-${item.selectedColor || "default"}`}
                      className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_90px] gap-5 items-center py-6"
                    >
                      <div className="flex gap-4 items-center">
                        <Link to={`/products/${item.product.id}`} className="shrink-0">
                          <img
                            src={getImageUrl(item.selectedColorImage || item.product.image, item.product.category)}
                            onError={imageFallbackHandler(item.product.category)}
                            alt={item.product.name}
                            className="w-24 h-28 object-cover rounded-xl bg-gray-100 border"
                          />
                        </Link>
                        <div>
                          <p className="text-xs text-gray-500">{item.product.category}</p>
                          <Link to={`/products/${item.product.id}`} className="font-semibold mt-1 block hover:text-orange-600">
                            {item.product.name}
                          </Link>
                          {item.selectedColor && (
                            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-md">
                              Color: <span className="text-orange-600">{item.selectedColor}</span>
                            </span>
                          )}
                          <p className={`text-sm mt-2 ${max <= 5 ? "text-amber-600 font-semibold" : "text-gray-500"}`}>
                            {max <= 5 ? `Only ${max} left` : "In Stock"}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.selectedColor)}
                            className="flex items-center gap-1 text-red-500 text-sm mt-3 hover:text-red-700"
                          >
                            <Trash2 size={15} />
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="font-semibold">
                        <span className="md:hidden text-gray-500 font-normal">Price: </span>
                        {formatPrice(item.product.price)}
                      </div>

                      <div className="flex items-center border rounded-xl w-fit">
                        <button
                          onClick={() => decreaseQuantity(item.product.id, item.selectedColor)}
                          aria-label="Decrease quantity"
                          className="p-3 hover:bg-gray-100"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="px-3 font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.product.id, item.selectedColor)}
                          disabled={item.quantity >= max}
                          aria-label="Increase quantity"
                          className="p-3 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus size={15} />
                        </button>
                      </div>

                      <div className="font-bold">{formatPrice(item.product.price * item.quantity)}</div>
                    </div>
                  );
                })}
              </div>

              <Link to="/products" className="inline-flex items-center gap-2 text-sm font-medium hover:text-orange-500 mt-5">
                <ArrowLeft size={17} />
                Continue Shopping
              </Link>
            </div>

            <aside className="bg-gray-50 rounded-2xl p-6 h-fit border lg:sticky lg:top-28">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>

              <CouponBox />

              <div className="space-y-4 text-sm mt-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-semibold">−{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                </div>
                <div className="border-t pt-4 flex flex-col gap-1">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-orange-500">{formatPrice(total)}</span>
                  </div>
                  {currentCurrency.code !== "USD" && (
                    <span className="text-[11px] text-gray-400 text-right">Charged as ${total.toFixed(2)} USD</span>
                  )}
                </div>
              </div>

              <Link
                to={isAuthenticated ? "/checkout" : "/login"}
                state={isAuthenticated ? undefined : { from: "/checkout" }}
                className="w-full bg-black text-white py-4 rounded-full mt-6 hover:bg-orange-500 transition font-semibold flex items-center justify-center gap-2"
              >
                {isAuthenticated ? "Proceed to Checkout" : "Sign in to Checkout"}
                <ArrowRight size={18} />
              </Link>

              <p className="text-xs text-center text-gray-500 mt-4 flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                Secure checkout · 30-day returns
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
