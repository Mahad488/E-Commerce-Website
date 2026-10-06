import {
  Shirt,
  Smartphone,
  Watch,
  ShoppingBag,
  Footprints,
  Gamepad2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const categories = [
  {
    name: "Fashion",
    icon: Shirt,
    color: "bg-pink-100 text-pink-600",
    hoverBorder: "hover:border-pink-300",
    badge: "Trending",
    badgeBg: "bg-pink-500",
    description: "Apparel, Jackets & Casual Wear",
    itemCount: "20+ Items",
  },
  {
    name: "Electronics",
    icon: Smartphone,
    color: "bg-blue-100 text-blue-600",
    hoverBorder: "hover:border-blue-300",
    badge: "Best Seller",
    badgeBg: "bg-blue-500",
    description: "Headphones, Audio & Tech",
    itemCount: "15+ Items",
  },
  {
    name: "Accessories",
    icon: Watch,
    color: "bg-yellow-100 text-amber-600",
    hoverBorder: "hover:border-amber-300",
    badge: "Popular",
    badgeBg: "bg-amber-500",
    description: "Watches, Sunglasses & Bags",
    itemCount: "18+ Items",
  },
  {
    name: "Lifestyle",
    icon: ShoppingBag,
    color: "bg-emerald-100 text-emerald-600",
    hoverBorder: "hover:border-emerald-300",
    badge: "New",
    badgeBg: "bg-emerald-500",
    description: "Mugs, Travel & Living",
    itemCount: "12+ Items",
  },
  {
    name: "Footwear",
    icon: Footprints,
    color: "bg-purple-100 text-purple-600",
    hoverBorder: "hover:border-purple-300",
    badge: "Hot Deals",
    badgeBg: "bg-purple-500",
    description: "Sneakers & Sports Shoes",
    itemCount: "10+ Items",
  },
  {
    name: "Gaming & Tech",
    icon: Gamepad2,
    color: "bg-indigo-100 text-indigo-600",
    hoverBorder: "hover:border-indigo-300",
    badge: "Featured",
    badgeBg: "bg-indigo-500",
    description: "Keyboards & Fitness Bands",
    itemCount: "8+ Items",
  },
];

function Categories() {
  return (
    <section id="categories" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        {/* Section Title */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-3 border border-orange-100">
            <Sparkles size={14} />
            Curated Collections
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
            Shop By Category
          </h2>

          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-base">
            Discover top quality products organized by category for your everyday lifestyle.
          </p>
        </div>

        {/* Categories Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;

            return (
              <Link
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                key={cat.name}
                className={`group relative bg-white border border-gray-100 ${cat.hoverBorder} rounded-3xl p-7 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1.5 transition duration-300 overflow-hidden`}
              >
                {/* Badge */}
                <div className="flex justify-between items-start">
                  <div
                    className={`${cat.color} w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition duration-300 shadow-sm`}
                  >
                    <Icon size={28} strokeWidth={2} />
                  </div>

                  <span
                    className={`${cat.badgeBg} text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm`}
                  >
                    {cat.badge}
                  </span>
                </div>

                {/* Content */}
                <div className="mt-8">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-500 transition">
                      {cat.name}
                    </h3>
                    <span className="text-xs font-semibold text-gray-400">
                      {cat.itemCount}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {cat.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 text-xs font-bold text-gray-900 group-hover:text-orange-500 transition">
                    Explore Collection
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Promotional Category Spotlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
          {/* Spotlight 1 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 md:p-10 flex flex-col justify-between shadow-lg">
            <div className="z-10">
              <span className="bg-orange-500 text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Limited Time Offer
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold mt-4">
                Summer Fashion Trends 2026
              </h3>
              <p className="text-gray-300 text-sm mt-2 max-w-md">
                Get up to 30% OFF on casual jackets, t-shirts, and premium apparel.
              </p>
            </div>

            <div className="mt-8 z-10">
              <Link
                to="/products?category=Fashion"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition"
              >
                Shop Fashion Now
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Spotlight 2 */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 to-amber-500 text-white p-8 md:p-10 flex flex-col justify-between shadow-lg">
            <div className="z-10">
              <span className="bg-black text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
                Tech & Gadgets
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold mt-4">
                Next-Gen Audio & Smart Watches
              </h3>
              <p className="text-orange-100 text-sm mt-2 max-w-md">
                Immersive wireless headphones and smart wearables for everyday fitness.
              </p>
            </div>

            <div className="mt-8 z-10">
              <Link
                to="/products?category=Electronics"
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-white hover:text-black transition"
              >
                Explore Electronics
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export default Categories;