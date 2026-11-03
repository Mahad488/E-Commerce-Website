import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Check, CheckCircle2, ChevronDown, Copy } from "lucide-react";

import { API_BASE_URL } from "../config/api";
import { DUR, EASE } from "../lib/motion";
import Wordmark from "./Wordmark";

const GROUPS = [
  {
    title: "Shop",
    links: [
      { to: "/products", label: "Shop all" },
      { to: "/products?sale=true", label: "Deals" },
      { to: "/categories", label: "Categories" },
      { to: "/products?sort=popular", label: "Best sellers" },
      { to: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: "/track-order", label: "Track an order" },
      { to: "/faq", label: "Delivery and returns" },
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "NOVA",
    links: [
      { to: "/about", label: "About" },
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer id="footer" className="on-night bg-night text-white">
      <div className="wrap grid gap-10 pb-[calc(32px+env(safe-area-inset-bottom,0px))] pt-14 lg:grid-cols-[1.2fr_2fr] lg:gap-16 lg:pt-20">
        <div className="grid content-start gap-5">
          <Link to="/" aria-label="NOVA home" className="w-fit text-[1.75rem]">
            <Wordmark />
          </Link>
          <p className="max-w-[38ch] text-sm text-on-night-muted">
            Fashion, footwear, accessories, tech and lifestyle picks. Pay by card, wallet or cash on delivery.
          </p>
          <Newsletter />
        </div>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-8">
          {GROUPS.map((group) => (
            <LinkGroup key={group.title} title={group.title} links={group.links} />
          ))}
        </div>
      </div>

      <div className="wrap flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-on-night-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} NOVA Store</p>
        <a href="mailto:support@novastore.com" className="hover:text-white">
          support@novastore.com
        </a>
      </div>
    </footer>
  );
}

/** Always open from 640px up; a tap-to-open accordion on phones so the footer stays short. */
function LinkGroup({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const id = `footer-${title.toLowerCase()}`;
  return (
    <div className="border-b border-white/10 sm:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between py-3.5 text-left font-semibold sm:pointer-events-none sm:py-0 sm:pb-4"
      >
        {title}
        <ChevronDown size={18} className={`transition-transform duration-200 sm:hidden ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      <ul id={id} className={`${open ? "grid" : "hidden"} gap-3 pb-4 text-sm text-on-night-muted sm:grid sm:pb-0`}>
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubscribe = async (e: FormEvent) => {
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
      setMessage(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Couldn't reach the server. Try again in a minute.");
      setStatus("error");
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code is on screen anyway.
    }
  };

  return (
    <div className="grid max-w-md gap-2">
      <p className="font-semibold">Get 10% off your first order</p>
      <AnimatePresence mode="wait" initial={false}>
        {status === "done" ? (
          <m.div
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR.base, ease: EASE.out }}
            className="grid gap-3 rounded-control bg-night-2 p-4 text-sm"
          >
            <p className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success-on-night" aria-hidden="true" />
              {message || "You're on the list."}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center justify-between rounded-tag border border-dashed border-white/40 px-3 py-2.5 hover:border-white"
              aria-label={copied ? "Code copied" : `Copy code ${couponCode}`}
            >
              <span className="type-code">{couponCode}</span>
              <span className="flex items-center gap-1.5 text-xs text-on-night-muted">
                {copied ? <Check size={15} className="text-success-on-night" /> : <Copy size={15} />}
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </m.div>
        ) : (
          <m.form key="form" onSubmit={handleSubscribe} exit={{ opacity: 0, transition: { duration: 0.12 } }} className="grid gap-2">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <div className="flex gap-2">
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={status === "error"}
                aria-describedby={status === "error" ? "newsletter-error" : undefined}
                className="input"
              />
              <button type="submit" disabled={status === "loading"} className="btn btn-secondary shrink-0">
                {status === "loading" ? "Joining…" : "Join"}
              </button>
            </div>
            {status === "error" && (
              <p id="newsletter-error" className="text-sm text-error-on-night">
                {message}
              </p>
            )}
          </m.form>
        )}
      </AnimatePresence>
    </div>
  );
}
