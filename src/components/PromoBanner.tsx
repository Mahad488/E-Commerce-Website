import { ArrowRight, Flame, Sparkles } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="bg-neutral-950 py-16 lg:py-24 text-white relative overflow-hidden scroll-reveal">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-5 lg:px-8 relative z-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-amber-500 to-rose-600 animate-gradient-x p-8 sm:p-12 md:p-16 shadow-2xl">
          
          {/* Subtle floating badge */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4 border border-white/20 animate-badge-bounce">
                <Flame size={14} className="text-amber-300" />
                <span>Limited Seasonal Drop</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Up to 40% Off Seasonal Essentials
              </h2>

              <p className="mt-4 text-orange-100 text-sm sm:text-base font-normal max-w-lg leading-relaxed">
                Take advantage of limited-time discounts across our signature winter and spring collections. Don’t miss out.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <a
                href="#products"
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-black text-gray-950 hover:bg-black hover:text-white shadow-2xl active:scale-95 transition-all duration-300"
              >
                <Sparkles size={16} className="text-orange-500 group-hover:text-amber-400" />
                <span>Shop The Sale</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-300 group-hover:translate-x-1.5"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
