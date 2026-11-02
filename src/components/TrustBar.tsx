import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const ITEMS = [
  { icon: Truck, title: "Free shipping", text: "On every order over $100", to: "/faq" },
  { icon: RotateCcw, title: "30-day returns", text: "No-hassle exchanges", to: "/faq" },
  { icon: ShieldCheck, title: "Secure checkout", text: "Card, wallet or cash on delivery", to: "/faq" },
  { icon: Headphones, title: "Real support", text: "We reply within 24 hours", to: "/contact" },
];

export default function TrustBar() {
  return (
    <section className="bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
        {ITEMS.map(({ icon: Icon, title, text, to }) => (
          <Link key={title} to={to} className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5 lg:p-7 hover:bg-orange-50/40 transition">
            <span className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-6 transition">
              <Icon size={22} />
            </span>
            <span>
              <span className="block font-bold text-sm text-gray-900">{title}</span>
              <span className="block text-xs text-gray-500 mt-0.5">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
