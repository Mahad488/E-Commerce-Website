import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";

interface LegalProps {
  kind: "privacy" | "terms";
}

const UPDATED = "November 2026";

const CONTENT = {
  privacy: {
    title: "Privacy Policy",
    sections: [
      {
        h: "What we collect",
        p: "Your name, email and password (stored only as a bcrypt hash) when you create an account; the delivery address and phone number you enter at checkout; your orders and reviews; and messages you send through the contact form. We do not store card numbers.",
      },
      {
        h: "How we use it",
        p: "To process and deliver orders, show your order history, answer support requests and — if you subscribe — send the newsletter. We don't sell your data.",
      },
      {
        h: "What stays on your device",
        p: "Your cart, wishlist, chosen currency and recently viewed products are saved in your browser's local storage so they survive a page refresh. Clearing site data removes them.",
      },
      {
        h: "Your choices",
        p: "You can update your profile at any time from your account page, and ask us to delete your account or unsubscribe by contacting support.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    sections: [
      {
        h: "Orders",
        p: "Placing an order is an offer to buy. Prices, discounts and stock are confirmed by our server when you check out; if an item sells out before then, we'll tell you before anything is charged.",
      },
      {
        h: "Prices & currency",
        p: "Prices are set in US dollars. Converted prices are shown for convenience using reference rates and may differ slightly from your bank's rate.",
      },
      {
        h: "Coupons",
        p: "One coupon per order. Codes may have minimum order values, expiry dates or usage limits, and can't be exchanged for cash.",
      },
      {
        h: "Returns",
        p: "Unused items in original packaging may be returned within 30 days of delivery. See the FAQ for details.",
      },
      {
        h: "Reviews",
        p: "Reviews must be your own honest experience. We may remove reviews that are abusive, off-topic or misleading.",
      },
    ],
  },
};

export default function Legal({ kind }: LegalProps) {
  const content = CONTENT[kind];
  return (
    <PageShell eyebrow="Legal" title={content.title} subtitle={`Last updated ${UPDATED}`}>
      <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-10">
        This is a plain-language template for a demo store. Have it reviewed before using it for a real business.
      </p>
      <div className="space-y-8">
        {content.sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-lg font-black">{section.h}</h2>
            <p className="text-gray-600 leading-relaxed mt-2">{section.p}</p>
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-gray-500">
        Questions? <Link to="/contact" className="text-orange-600 font-semibold underline">Contact us</Link>.
      </p>
    </PageShell>
  );
}
