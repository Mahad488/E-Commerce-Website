import { ArrowRight, Sparkles, Star, TrendingUp, ShieldCheck } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative bg-[#f6f3ee] overflow-hidden pt-6 pb-16 lg:py-20">
      {/* Ambient background decorative blur blobs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-orange-200/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[580px]">

          {/* Left Content Column (7 cols) */}
          <div className="lg:col-span-7 py-6 lg:py-12">
            
            {/* Animated Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-100/80 border border-orange-200 text-orange-700 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase shadow-xs mb-6 animate-badge-bounce">
              <Sparkles size={14} className="text-orange-500 shrink-0" />
              <span>Spring / Summer 2026 Collection</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.06] tracking-tight text-gray-900">
              Discover <br />
              <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 bg-clip-text text-transparent">
                Your Style.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-gray-600 mt-6 text-base sm:text-lg max-w-xl leading-relaxed font-normal">
              Explore curated modern fashion, refined electronics, and timeless essentials engineered to elevate your daily routine.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 mt-8">
              <a
                href="#products"
                className="group relative inline-flex items-center gap-3 bg-gray-950 text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/25 active:scale-95 transition-all duration-300"
              >
                <span>Shop Collection</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                />
              </a>

              <a
                href="#categories"
                className="inline-flex items-center px-8 py-4 rounded-full font-bold text-sm text-gray-800 border border-gray-300/80 hover:border-gray-950 hover:bg-white hover:shadow-md active:scale-95 transition-all duration-300"
              >
                Explore Categories
              </a>
            </div>

            {/* Quick Guarantees / Features Ticker */}
            <div className="flex flex-wrap items-center gap-6 mt-10 pt-8 border-t border-gray-300/60 text-xs font-semibold text-gray-600">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>100% Authentic Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-orange-600" />
                <span>Express Worldwide Shipping</span>
              </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-6 sm:gap-8 mt-10 max-w-md">
              <div className="group p-3 rounded-2xl transition hover:bg-white/80">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  10K+
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
                  Happy Clients
                </p>
              </div>

              <div className="group p-3 rounded-2xl transition hover:bg-white/80">
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                  500+
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
                  Products Live
                </p>
              </div>

              <div className="group p-3 rounded-2xl transition hover:bg-white/80">
                <div className="flex items-center gap-1">
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">
                    4.9
                  </h3>
                  <Star size={18} className="fill-amber-400 text-amber-400 shrink-0" />
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 font-medium">
                  Top Rating
                </p>
              </div>
            </div>
          </div>

          {/* Right Image Column with Floating Badges (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Visual Container */}
            <div className="relative w-full max-w-lg">
              
              {/* Outer decorative ring */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-orange-400/20 via-transparent to-rose-400/20 blur-lg" />

              {/* Main Image with Zoom on hover */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85"
                  alt="Modern Fashion & Trends Collection"
                  className="w-full h-[460px] sm:h-[520px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                
                {/* Subtle gradient vignette overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Badge 1: Top Left / Floating */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 animate-float-slow z-20">
                <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                  <TrendingUp size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Trending Now
                  </p>
                  <p className="text-xs font-black text-gray-900">
                    Up to 40% Off
                  </p>
                </div>
              </div>

              {/* Floating Badge 2: Bottom Right / Floating Delayed */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-white/60 flex items-center gap-3 animate-float-delayed z-20">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                  <Star size={18} className="fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black text-gray-900">4.9 / 5.0</span>
                    <span className="text-[10px] text-gray-500">(1,240+ reviews)</span>
                  </div>
                  <p className="text-[10px] font-semibold text-emerald-600">
                    Verified Customer Love
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}