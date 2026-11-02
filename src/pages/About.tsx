import { Link } from "react-router-dom";
import { Leaf, PackageCheck, Sparkles, HeartHandshake, ArrowRight } from "lucide-react";

import PageShell from "../components/PageShell";

const VALUES = [
  {
    icon: Sparkles,
    title: "Curated, not cluttered",
    text: "A tight edit of fashion, tech and everyday essentials — every product earns its place.",
  },
  {
    icon: PackageCheck,
    title: "Honest stock & pricing",
    text: "Live stock counts, clear sale prices and no surprise fees at checkout.",
  },
  {
    icon: HeartHandshake,
    title: "Support that answers",
    text: "Real people, real replies, and a 30-day return window on everything.",
  },
  {
    icon: Leaf,
    title: "Built to last",
    text: "We favour durable materials and timeless designs over throwaway trends.",
  },
];

export default function About() {
  return (
    <PageShell
      eyebrow="Our story"
      title="About NOVA"
      subtitle="NOVA is a modern lifestyle store for people who want fewer, better things."
      width="wide"
    >
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80"
          alt="Shopping bags in a bright boutique"
          className="w-full h-[420px] object-cover rounded-3xl shadow-xl"
        />
        <div className="space-y-5 text-gray-700 leading-relaxed">
          <h2 className="text-3xl font-black text-gray-900">Fewer tabs. Better finds.</h2>
          <p>
            We started NOVA because shopping online had become a scroll through endless near-identical listings. We wanted
            the opposite: a small, considered catalogue where every jacket, pair of headphones and coffee mug is something
            we'd happily use ourselves.
          </p>
          <p>
            Every order is tracked from the moment you place it, prices are shown in your currency, and you can pay the way
            that suits you — card, mobile wallet or cash on delivery.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-black text-white rounded-full px-7 py-3.5 text-sm font-bold hover:bg-orange-500 transition"
          >
            Explore the collection <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-20">
        {VALUES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border p-6 hover:shadow-lg hover:-translate-y-1 transition">
            <span className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Icon size={22} />
            </span>
            <h3 className="font-bold mt-4">{title}</h3>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
