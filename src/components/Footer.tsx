import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, Send, CheckCircle2, Copy, Check } from "lucide-react";

import { API_BASE_URL } from "../config/api";

const SHOP_LINKS = [
  { to: "/products", label: "All Products" },
  { to: "/products?sale=true", label: "Deals & Sales" },
  { to: "/categories", label: "Browse Categories" },
  { to: "/products?sort=popular", label: "Best Sellers" },
  { to: "/wishlist", label: "My Wishlist" },
];

const HELP_LINKS = [
  { to: "/track-order", label: "Track Your Order" },
  { to: "/faq", label: "Shipping & Returns" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Support" },
  { to: "/about", label: "About NOVA" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not subscribe");
      setCouponCode(data.couponCode || "WELCOME10");
      setMessage(data.message);
      setStatus("done");
      setEmail("");
    } catch (err) {
      setMessage(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Couldn't reach the server. Try again shortly.");
      setStatus("error");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — code is visible anyway
    }
  };

  return (
    <footer id="footer" className="bg-neutral-950 text-white pt-20 pb-12 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="text-3xl font-black tracking-tight">
              NOVA<span className="text-orange-500">.</span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mt-5 max-w-xs">
              Your modern destination for premium lifestyle, timeless fashion, tech accessories, and everyday essentials.
            </p>
            <div className="flex gap-3.5 mt-6">
              <Link
                to="/contact"
                aria-label="Contact support"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 hover:scale-110 transition-all duration-200"
              >
                <MessageCircle size={18} />
              </Link>
              <a
                href="mailto:support@novastore.com"
                aria-label="Email support"
                className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-orange-500 hover:border-orange-500/50 hover:scale-110 transition-all duration-200"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-bold text-base mb-5 tracking-wide">Shop</h3>
            <ul className="space-y-3 text-sm text-neutral-400 font-medium">
              {SHOP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-bold text-base mb-5 tracking-wide">Customer Care</h3>
            <ul className="space-y-3 text-sm text-neutral-400 font-medium">
              {HELP_LINKS.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="hover:text-orange-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-bold text-base mb-5 tracking-wide">Get 10% Off</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Join the list for early drops, private sales and a welcome code for your first order.
            </p>

            {status === "done" ? (
              <div className="mt-5 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold space-y-3 animate-fade-in">
                <p className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  {message}
                </p>
                <button
                  onClick={copyCode}
                  className="w-full flex items-center justify-between bg-neutral-950 border border-dashed border-emerald-500/50 rounded-xl px-3 py-2 font-mono text-sm text-white hover:border-emerald-400"
                >
                  {couponCode}
                  {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>
            ) : (
              <>
                <form
                  className="flex items-center mt-5 bg-neutral-900 border border-neutral-800 rounded-full p-1.5 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-300"
                  onSubmit={handleSubscribe}
                >
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-w-0 flex-1 px-4 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none bg-transparent"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    aria-label="Subscribe to newsletter"
                    className="bg-orange-600 text-white p-2.5 sm:px-4 sm:py-2.5 rounded-full hover:bg-orange-500 active:scale-95 transition-all duration-200 flex items-center gap-1.5 text-xs font-bold disabled:opacity-60"
                  >
                    <Send size={15} />
                    <span className="hidden sm:inline">{status === "loading" ? "…" : "Join"}</span>
                  </button>
                </form>
                {status === "error" && <p className="text-xs text-rose-400 mt-2">{message}</p>}
              </>
            )}
          </div>
        </div>

        <div className="border-t border-neutral-900 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <p>© {new Date().getFullYear()} NOVA Store. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-neutral-300 transition">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-neutral-300 transition">
              Privacy
            </Link>
            <Link to="/faq" className="hover:text-neutral-300 transition">
              Returns
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
