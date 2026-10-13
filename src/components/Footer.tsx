import { Globe, Mail, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setSubscribed(false);
        setEmail("");
      }, 4000);
    }
  };

  return (
    <footer id="footer" className="bg-neutral-950 text-white pt-20 pb-12 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand */}
          <div>
            <h2 className="text-3xl font-black tracking-tight">
              NOVA<span className="text-orange-500">.</span>
            </h2>

            <p className="text-neutral-400 text-sm leading-relaxed mt-5 max-w-xs font-normal">
              Your modern destination for premium lifestyle, timeless fashion, tech accessories, and everyday essentials.
            </p>

            <div className="flex gap-3.5 mt-6">
              <a
                href="#footer"
                aria-label="Website"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <Globe size={18} />
              </a>
              <a
                href="#footer"
                aria-label="Community"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <MessageCircle size={18} />
              </a>
              <a
                href="mailto:support@novastore.com"
                aria-label="Email"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-5 text-white tracking-wide">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm text-neutral-400 font-medium">
              <li>
                <a href="/" className="hover:text-orange-400 transition-colors">
                  Home Catalog
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-orange-400 transition-colors">
                  Browse Categories
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-orange-400 transition-colors">
                  Featured Deals
                </a>
              </li>
              <li>
                <a href="#footer" className="hover:text-orange-400 transition-colors">
                  About NOVA
                </a>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h3 className="font-bold text-base mb-5 text-white tracking-wide">
              Customer Support
            </h3>

            <ul className="space-y-3 text-sm text-neutral-400 font-medium">
              <li className="hover:text-orange-400 transition-colors cursor-pointer">
                24/7 Live Chat Help
              </li>
              <li className="hover:text-orange-400 transition-colors cursor-pointer">
                Global Track Order
              </li>
              <li className="hover:text-orange-400 transition-colors cursor-pointer">
                Easy Returns & Warranty
              </li>
              <li className="hover:text-orange-400 transition-colors cursor-pointer">
                Privacy & Security Notice
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-base mb-5 text-white tracking-wide">
              Stay in the Loop
            </h3>

            <p className="text-sm text-neutral-400 leading-relaxed font-normal">
              Subscribe for VIP flash drops, early product releases, and private sale codes.
            </p>

            {subscribed ? (
              <div className="mt-5 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>You're in! Check your inbox for 15% off.</span>
              </div>
            ) : (
              <form
                className="flex items-center mt-5 bg-neutral-900 border border-neutral-800 rounded-full p-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-300"
                onSubmit={handleSubscribe}
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-1 px-4 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none bg-transparent"
                />

                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="bg-orange-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">Join</span>
                </button>
              </form>
            )}
          </div>

        </div>

        <div className="border-t border-neutral-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© 2026 NOVA Store. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-neutral-400 cursor-pointer transition">Terms</span>
            <span className="hover:text-neutral-400 cursor-pointer transition">Privacy</span>
            <span className="hover:text-neutral-400 cursor-pointer transition">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}