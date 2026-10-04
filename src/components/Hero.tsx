import { ArrowRight } from "lucide-react";

function Hero() {
  return (
    <section className="bg-[#f5f2ed] overflow-hidden">

      <div className="max-w-7xl mx-auto px-5 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 items-center min-h-130">

          {/* Left Content */}
          <div className="py-16 md:py-20">

            <span className="text-orange-600 font-semibold text-sm tracking-widest uppercase">
              New Collection 2026
            </span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] mt-5 text-gray-900">
              Discover
              <br />
              Your Style.
            </h1>

            <p className="text-gray-600 mt-6 text-base md:text-lg max-w-md leading-7">
              Explore the latest trends, discover your favorite products,
              and make every moment stylish.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">

              <a
                href="#products"
                className="inline-flex items-center gap-3 bg-black text-white px-7 py-4 rounded-full font-medium hover:bg-orange-500 transition"
              >
                Shop Now
                <ArrowRight size={18} />
              </a>

              <a
                href="#categories"
                className="border border-gray-400 px-7 py-4 rounded-full font-medium hover:bg-white transition"
              >
                Explore
              </a>

            </div>

            <div className="flex gap-10 mt-12">

              <div>
                <h3 className="text-2xl font-bold">10K+</h3>
                <p className="text-sm text-gray-500 mt-1">Happy Customers</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold">500+</h3>
                <p className="text-sm text-gray-500 mt-1">Products</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold">4.9</h3>
                <p className="text-sm text-gray-500 mt-1">Customer Rating</p>
              </div>

            </div>
          </div>

          {/* Right Image */}
          <div className="h-full min-h-100 flex items-center justify-center">

            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85"
              alt="Fashion collection"
              className="w-full h-112.5 md:h-130 object-cover rounded-2xl"
            />

          </div>

        </div>
      </div>
    </section>
  );
}

export default Hero;