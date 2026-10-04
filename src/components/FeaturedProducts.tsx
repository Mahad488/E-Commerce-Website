import { Heart, ShoppingCart, Star } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Premium Casual Jacket",
    category: "Fashion",
    price: 89.99,
    oldPrice: 120,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    tag: "SALE",
  },
  {
    id: 2,
    name: "Classic Sneakers",
    category: "Footwear",
    price: 65.00,
    oldPrice: 85,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    tag: "POPULAR",
  },
  {
    id: 3,
    name: "Minimal Wrist Watch",
    category: "Accessories",
    price: 110,
    oldPrice: 140,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    tag: "NEW",
  },
  {
    id: 4,
    name: "Modern Headphones",
    category: "Electronics",
    price: 75,
    oldPrice: 99,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    tag: "SALE",
  },
];

function FeaturedProducts() {
  return (
    <section id="products" className="py-20 bg-gray-50">

      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">

          <div>
            <span className="text-orange-500 text-sm font-semibold uppercase tracking-widest">
              Our Collection
            </span>

            <h2 className="text-3xl md:text-4xl font-bold mt-3">
              Featured Products
            </h2>

            <p className="text-gray-500 mt-2">
              Handpicked products just for you.
            </p>
          </div>

          <a
            href="#products"
            className="text-sm font-semibold hover:text-orange-500"
          >
            View All Products →
          </a>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden group hover:shadow-xl transition duration-300"
            >

              <div className="relative overflow-hidden">

                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-72 object-cover group-hover:scale-105 transition duration-500"
                />

                <span className="absolute top-4 left-4 bg-orange-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold">
                  {product.tag}
                </span>

                <button
                  aria-label={`Add ${product.name} to wishlist`}
                  className="absolute top-4 right-4 bg-white p-2.5 rounded-full shadow hover:text-red-500 transition"
                >
                  <Heart size={18} />
                </button>

                <button className="absolute bottom-4 left-4 right-4 bg-black text-white py-3 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                  <ShoppingCart size={17} />
                  Add to Cart
                </button>

              </div>

              <div className="p-5">

                <p className="text-xs text-gray-500">
                  {product.category}
                </p>

                <h3 className="font-semibold mt-2">
                  {product.name}
                </h3>

                <div className="flex items-center gap-1 mt-2">
                  <Star size={15} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">
                    {product.rating}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <span className="text-lg font-bold">
                    ${product.price.toFixed(2)}
                  </span>

                  <span className="text-sm text-gray-400 line-through">
                    ${product.oldPrice.toFixed(2)}
                  </span>
                </div>

              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;