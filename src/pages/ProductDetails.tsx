import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { products } from "../data/products";
import { useCart } from "../context/CartContext";

function ProductDetails() {
  const { addToCart } = useCart();
  const { id } = useParams();

  const product = products.find((item) => item.id === Number(id));

  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">

        <h1 className="text-3xl font-bold">
          Product Not Found
        </h1>

        <Link to="/products" className="mt-5 text-orange-500">
          Back to Products
        </Link>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-12">

        <Link
          to="/products"
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="grid md:grid-cols-2 gap-12 items-start">

          {/* Product Image */}
          <div className="bg-gray-50 rounded-2xl overflow-hidden">

            <img
              src={product.image}
              alt={product.name}
              className="w-full h-112.5 md:h-150 object-cover"
            />

          </div>

          {/* Product Information */}
          <div className="py-5">

            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
              {product.category}
            </span>

            <h1 className="text-3xl md:text-4xl font-bold mt-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-5">

              <Star size={18} className="fill-yellow-400 text-yellow-400" />

              <span className="font-medium">
                {product.rating}
              </span>

              <span className="text-gray-400 text-sm">
                Customer Rating
              </span>

            </div>

            <div className="flex items-center gap-4 mt-7">

              <span className="text-3xl font-bold">
                ${product.price.toFixed(2)}
              </span>

              <span className="text-lg text-gray-400 line-through">
                ${product.oldPrice.toFixed(2)}
              </span>

            </div>

            <div className="border-t border-gray-100 mt-8 pt-7">

              <h3 className="font-semibold text-lg">
                Product Description
              </h3>

              <p className="text-gray-600 leading-7 mt-3">
                {product.description}
              </p>

            </div>

            <div className="mt-7">

              <p className="text-sm text-gray-600">
                Availability:{" "}
                <span className="text-green-600 font-semibold">
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </p>

            </div>

            {/* Quantity */}
            <div className="mt-8">

              <p className="font-semibold mb-3">
                Quantity
              </p>

              <div className="flex items-center border rounded-xl w-fit">

                <button
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-4 hover:bg-gray-100"
                >
                  <Minus size={16} />
                </button>

                <span className="px-5 font-semibold">
                  {quantity}
                </span>

                <button
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stock, q + 1))
                  }
                  className="p-4 hover:bg-gray-100 disabled:opacity-40"
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
              }}
              disabled={product.stock === 0}
              className="mt-8 w-full bg-black text-white py-4 rounded-full flex items-center justify-center gap-3 hover:bg-orange-500 transition disabled:opacity-50"
            >
              <ShoppingCart size={19} />
              Add to Cart
            </button>

            <p className="text-center text-gray-500 text-sm mt-5">
              Secure shopping • Quality products • Easy returns
            </p>

          </div>
        </div>
      </div>

      <Footer />

    </div>
  );
}

export default ProductDetails;