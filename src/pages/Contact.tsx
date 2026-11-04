import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Mail, MessageSquare, PackageSearch, Send } from "lucide-react";

import PageShell from "../components/PageShell";
import EmailNotice from "../components/EmailNotice";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

const SUBJECTS = ["Order help", "Returns & refunds", "Product question", "Payment issue", "Partnership", "Something else"];

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: SUBJECTS[0],
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Could not send your message");
      setTicket(data.ticketId);
      setConfirmationEmail(data.confirmationEmail || "");
    } catch (err) {
      setError(
        err instanceof Error && err.message !== "Failed to fetch"
          ? err.message
          : "Can't reach the server right now. You can also email support@novastore.com."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <PageShell eyebrow="Support" title="Get in touch" subtitle="Questions about an order, a product or a return? Send us a message." width="wide">
      <div className="grid lg:grid-cols-[1fr_340px] gap-10">
        <div className="bg-white border rounded-3xl p-6 sm:p-8 shadow-sm">
          {ticket ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-black mt-5">Message sent</h2>
              <p className="text-gray-600 mt-2">
                Your reference is <span className="font-mono font-bold">{ticket}</span>. We usually reply within 24 hours.
              </p>
              {confirmationEmail && (
                <EmailNotice className="mx-auto mt-5 max-w-md">
                  A confirmation email is on its way to <strong>{confirmationEmail}</strong>. Reply to it if you want to add
                  anything.
                </EmailNotice>
              )}
              <button
                onClick={() => {
                  setTicket("");
                  setForm((prev) => ({ ...prev, message: "" }));
                }}
                className="mt-6 text-sm font-bold text-orange-600 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 uppercase">Name</span>
                  <input
                    required
                    minLength={2}
                    value={form.name}
                    onChange={update("name")}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-gray-700 uppercase">Email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-gray-700 uppercase">Topic</span>
                <select
                  value={form.subject}
                  onChange={update("subject")}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 bg-white"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-700 uppercase flex justify-between">
                  Message <span className="font-normal normal-case text-gray-400">{form.message.length}/3000</span>
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={6}
                  value={form.message}
                  onChange={update("message")}
                  placeholder="Include your order number if it's about an order."
                  className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 resize-y"
                />
              </label>
              {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>}
              <button
                type="submit"
                disabled={sending}
                className="bg-black text-white rounded-full px-8 py-3.5 font-bold text-sm hover:bg-orange-500 transition flex items-center gap-2 disabled:opacity-60"
              >
                <Send size={16} />
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {[
            { icon: PackageSearch, title: "Where's my order?", text: "Get live status without waiting for a reply.", to: "/track-order", cta: "Track an order" },
            { icon: MessageSquare, title: "Quick answers", text: "Shipping times, returns, payments and coupons.", to: "/faq", cta: "Read the FAQ" },
          ].map(({ icon: Icon, title, text, to, cta }) => (
            <Link key={title} to={to} className="block border rounded-3xl p-5 hover:border-orange-300 hover:shadow-md transition">
              <Icon size={22} className="text-orange-500" />
              <p className="font-bold mt-3">{title}</p>
              <p className="text-sm text-gray-500 mt-1">{text}</p>
              <p className="text-sm font-bold text-orange-600 mt-3">{cta} →</p>
            </Link>
          ))}
          <div className="border rounded-3xl p-5 text-sm space-y-3">
            <p className="flex items-center gap-2.5">
              <Mail size={17} className="text-orange-500" />
              <a href="mailto:support@novastore.com" className="font-semibold hover:underline">support@novastore.com</a>
            </p>
            <p className="flex items-center gap-2.5 text-gray-600">
              <Clock size={17} className="text-orange-500" />
              Replies within 24 hours, 7 days a week
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
