import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, Loader2, Printer, XCircle } from "lucide-react";
import PageShell from "../components/PageShell";
import EmailNotice from "../components/EmailNotice";
import OrderInvoiceModal, { type InvoiceData } from "../components/OrderInvoiceModal";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { API_BASE_URL } from "../config/api";

type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled" | "review";

/** An order as GET /api/payments/orders/:id returns it (orders.* plus the customer and items). */
interface ResultOrder extends InvoiceData {
  user_name?: string;
  user_email?: string;
}

type Result =
  | { phase: "checking" }
  | { phase: "waiting" }
  | { phase: PaymentStatus; order: ResultOrder | null }
  | { phase: "error"; message: string };

const POLL_EVERY_MS = 2000;
const POLL_TRIES = 15;

/**
 * Where Stripe Checkout sends the shopper back to: /checkout/result?order=12 (paid or still
 * processing) or ?order=12&cancelled=1 (they left without paying). The backend asks Stripe,
 * so the page never trusts the URL.
 */
export default function CheckoutResult() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { token, isAuthenticated } = useAuth();
  const { clearCart } = useCart();
  const orderId = Number(params.get("order"));
  const cancelled = params.get("cancelled") === "1";
  const [result, setResult] = useState<Result>({ phase: "checking" });
  const [round, setRound] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const cartCleared = useRef(false);

  useEffect(() => {
    if (!token || !Number.isSafeInteger(orderId) || orderId <= 0) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let tries = 0;
    const headers = { Authorization: `Bearer ${token}` };
    const fail = (message: string) => !stopped && setResult({ phase: "error", message });

    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/orders/${orderId}`, { headers });
        const data = await res.json();
        if (stopped) return;
        if (!res.ok) return fail(data.message || "We couldn't find that payment.");
        if (data.status === "pending") {
          tries += 1;
          if (tries < POLL_TRIES) {
            timer = setTimeout(check, POLL_EVERY_MS);
          } else {
            setResult({ phase: "waiting" });
          }
          return;
        }
        setResult({ phase: data.status, order: data.order });
      } catch {
        fail("Can't reach the server right now. Check your connection, then try again.");
      }
    };

    const cancel = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/payments/orders/${orderId}/cancel`, { method: "POST", headers });
        const data = await res.json();
        if (stopped) return;
        if (!res.ok) return fail(data.message || "We couldn't cancel that payment.");
        // The shopper may have paid in another tab just before cancelling.
        if (data.status === "paid" || data.status === "pending") return check();
        setResult({ phase: data.status, order: null });
      } catch {
        fail("Can't reach the server right now. Check your connection, then try again.");
      }
    };

    if (cancelled) cancel();
    else check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [token, orderId, cancelled, round]);

  useEffect(() => {
    if (result.phase === "paid" && !cartCleared.current) {
      cartCleared.current = true;
      clearCart();
    }
  }, [result.phase, clearCart]);

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    return <Navigate to="/checkout" replace />;
  }

  const checkAgain = () => {
    setResult({ phase: "checking" });
    setRound((n) => n + 1);
  };

  switch (result.phase) {
    case "checking":
    case "pending":
      return (
        <ResultShell title="Confirming your payment" subtitle="This usually takes a few seconds. Please keep this page open.">
          <p role="status" className="flex items-center gap-3 text-muted">
            <Loader2 size={20} className="motion-safe:animate-spin" aria-hidden /> Checking with Stripe…
          </p>
        </ResultShell>
      );

    case "waiting":
      return (
        <ResultShell
          icon={<Clock size={28} className="text-warning" aria-hidden />}
          title="We're still waiting for Stripe"
          subtitle={`Some payments take a little longer. If you paid, order #${orderId} is safe and we'll email you as soon as Stripe confirms it.`}
        >
          <Actions>
            <button type="button" onClick={checkAgain} className="btn btn-primary">
              Check again
            </button>
            <Link to="/account" className="btn btn-secondary">
              View my orders
            </Link>
          </Actions>
        </ResultShell>
      );

    case "paid":
      return (
        <ResultShell
          icon={<CheckCircle2 size={28} className="text-success" aria-hidden />}
          title="Payment received"
          subtitle={`Order #${orderId} is confirmed and we're getting it ready.`}
        >
          {result.order?.user_email && (
            <EmailNotice className="mb-6">
              A confirmation email is on its way to <strong>{result.order.user_email}</strong>. We'll email you again when your
              order ships.
            </EmailNotice>
          )}
          {result.order && <PaidSummary order={result.order} />}
          <Actions>
            {result.order && (
              <button type="button" onClick={() => setShowInvoice(true)} className="btn btn-primary">
                <Printer size={18} aria-hidden /> View invoice
              </button>
            )}
            <Link to={`/track-order?orderId=${orderId}`} className="btn btn-secondary">
              Track this order
            </Link>
            <Link to="/products" className="btn btn-ghost">
              Continue shopping
            </Link>
          </Actions>
          {showInvoice && result.order && (
            <OrderInvoiceModal
              order={{ ...result.order, customer_name: result.order.user_name, customer_email: result.order.user_email }}
              onClose={() => setShowInvoice(false)}
            />
          )}
        </ResultShell>
      );

    case "cancelled":
    case "expired":
    case "failed":
      return (
        <ResultShell
          icon={<XCircle size={28} className="text-error" aria-hidden />}
          title={
            result.phase === "cancelled"
              ? "Payment cancelled"
              : result.phase === "expired"
              ? "The payment timed out"
              : "The payment didn't go through"
          }
          subtitle="Nothing was charged and the items are back on sale. Your cart is still here, so you can try again or pay on delivery."
        >
          <Actions>
            <Link to="/checkout" className="btn btn-primary">
              Back to checkout
            </Link>
            <Link to="/cart" className="btn btn-secondary">
              View cart
            </Link>
          </Actions>
        </ResultShell>
      );

    case "review":
      return (
        <ResultShell
          icon={<AlertCircle size={28} className="text-warning" aria-hidden />}
          title="We need to check this payment"
          subtitle={`Stripe sent us a payment for order #${orderId} that we have to check by hand. You don't need to do anything: we'll email you about it.`}
        >
          <Actions>
            <Link to="/account" className="btn btn-primary">
              View my orders
            </Link>
            <Link to="/contact" className="btn btn-secondary">
              Contact us
            </Link>
          </Actions>
        </ResultShell>
      );

    case "error":
      return (
        <ResultShell icon={<AlertCircle size={28} className="text-error" aria-hidden />} title="Something went wrong" subtitle={result.message}>
          <Actions>
            <button type="button" onClick={checkAgain} className="btn btn-primary">
              Try again
            </button>
            <Link to="/account" className="btn btn-secondary">
              View my orders
            </Link>
          </Actions>
        </ResultShell>
      );
  }
}

function ResultShell({ icon, title, subtitle, children }: { icon?: ReactNode; title: string; subtitle: string; children: ReactNode }) {
  return (
    <PageShell
      title={title}
      subtitle={
        <span className="flex items-start gap-3">
          {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
          <span>{subtitle}</span>
        </span>
      }
    >
      <div className="max-w-2xl">{children}</div>
    </PageShell>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-wrap gap-3">{children}</div>;
}

function PaidSummary({ order }: { order: ResultOrder }) {
  const { formatPrice, currentCurrency } = useCurrency();
  const total = Number(order.total_amount);
  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity), 0);
  const rows: [string, ReactNode][] = [
    ["Order", `#${order.id}`],
    ["Items", `${itemCount} ${itemCount === 1 ? "item" : "items"}`],
    [
      "Paid",
      <span key="paid" className="tabular-nums">
        {formatPrice(total)}
        {currentCurrency.code !== "USD" && <span className="text-muted"> (charged ${total.toFixed(2)} USD)</span>}
      </span>,
    ],
    ["Payment", order.payment_method || "Card"],
    ["Delivering to", [order.address, order.city, order.country].filter(Boolean).join(", ")],
  ];
  if (order.transaction_id) rows.push(["Reference", <span key="ref" className="break-all font-mono text-sm">{order.transaction_id}</span>]);

  return (
    <dl className="divide-y divide-line rounded-tile border border-line bg-surface">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-1 px-5 py-3">
          <dt className="text-muted">{label}</dt>
          <dd className="text-right font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
