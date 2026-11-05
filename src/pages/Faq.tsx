import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search } from "lucide-react";

import PageShell from "../components/PageShell";

interface FaqItem {
  q: string;
  a: React.ReactNode;
  text: string; // plain text for search
}

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Shipping",
    items: [
      {
        q: "How much does shipping cost?",
        text: "Shipping is free on orders over $100. Below that a flat $10 fee applies. FREESHIP coupon",
        a: (
          <>
            Shipping is <strong>free on orders over $100</strong>. Below that, a flat $10 fee applies — or use the code{" "}
            <code className="font-mono font-bold">FREESHIP</code> to waive it.
          </>
        ),
      },
      {
        q: "How long does delivery take?",
        text: "Orders are dispatched within 1 business day and usually arrive in 3–5 business days.",
        a: "Orders are dispatched within 1 business day and usually arrive in 3–5 business days. Each product page shows an estimated delivery window.",
      },
      {
        q: "How can I track my order?",
        text: "Use the Track Order page with your order number and email, or open your account.",
        a: (
          <>
            Use the <Link to="/track-order" className="text-orange-600 font-semibold underline">Track Order</Link> page
            with your order number and email, or open <Link to="/account" className="text-orange-600 font-semibold underline">your account</Link> to see every order and its status.
          </>
        ),
      },
    ],
  },
  {
    title: "Returns & cancellations",
    items: [
      {
        q: "What is your return policy?",
        text: "Unused items in original packaging can be returned within 30 days of delivery for a full refund.",
        a: "Unused items in their original packaging can be returned within 30 days of delivery for a full refund to your original payment method. Contact support with your order number to start a return.",
      },
      {
        q: "Can I cancel my order?",
        text: "Yes, while the order is still Pending you can cancel it from your account. Stock is released immediately.",
        a: "Yes — while an order is still Pending you can cancel it yourself from your account page. Once it moves to Processing, contact support and we'll do our best to stop it.",
      },
    ],
  },
  {
    title: "Payments & coupons",
    items: [
      {
        q: "Which payment methods do you accept?",
        text: "Cash on delivery and credit/debit card.",
        a: "Cash on delivery and credit/debit cards. Card payments are taken on Stripe's secure page, so NOVA never sees your card number.",
      },
      {
        q: "How do coupon codes work?",
        text: "Enter a code in your cart or at checkout. One code per order. WELCOME10 SAVE15 NOVA20",
        a: (
          <>
            Enter a code in your cart or at checkout — one code per order. Some codes need a minimum order value, and the
            discount is re-checked when you place the order. Try <code className="font-mono font-bold">WELCOME10</code> for
            10% off.
          </>
        ),
      },
      {
        q: "Why are prices shown in my currency?",
        text: "The currency switcher converts prices for display. Orders are charged in US dollars.",
        a: "The currency switcher converts prices for display using reference exchange rates. Orders are charged in US dollars, so your bank's final amount can differ slightly.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "I forgot my password.",
        text: "Use Forgot password on the sign-in page to get a 6-digit code.",
        a: "Choose “Forgot password” on the sign-in page. We'll send a 6-digit code that's valid for 15 minutes.",
      },
      {
        q: "What does “Verified buyer” on a review mean?",
        text: "The reviewer was signed in and has ordered that product.",
        a: "The reviewer was signed in when they posted and has ordered that product from us.",
      },
    ],
  },
];

export default function Faq() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(SECTIONS[0].items[0].q);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return SECTIONS;
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => `${item.q} ${item.text}`.toLowerCase().includes(term)),
    })).filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <PageShell eyebrow="Help centre" title="Shipping, returns & FAQ" subtitle="Everything you need to know before and after you order.">
      <div className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-3.5 mb-10 focus-within:ring-2 focus-within:ring-orange-500 focus-within:bg-white transition">
        <Search size={18} className="text-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search questions"
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          No matches. <Link to="/contact" className="text-orange-600 font-semibold underline">Ask us directly</Link>.
        </p>
      )}

      <div className="space-y-10">
        {filtered.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-black mb-4">{section.title}</h2>
            <div className="border rounded-3xl divide-y overflow-hidden">
              {section.items.map((item) => {
                const isOpen = open === item.q || Boolean(query.trim());
                return (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpen(open === item.q ? null : item.q)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 font-semibold hover:bg-gray-50 transition"
                    >
                      {item.q}
                      <ChevronDown size={18} className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-orange-500" : ""}`} />
                    </button>
                    {isOpen && <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed animate-fade-in">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-3xl bg-gray-950 text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black text-lg">Still need help?</p>
          <p className="text-sm text-white/60">Our team replies within 24 hours.</p>
        </div>
        <Link to="/contact" className="bg-white text-gray-950 rounded-full px-6 py-3 text-sm font-bold hover:bg-orange-500 hover:text-white transition">
          Contact support
        </Link>
      </div>
    </PageShell>
  );
}
