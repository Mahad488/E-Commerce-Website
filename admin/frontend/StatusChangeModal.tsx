import { useState, type FormEvent } from "react";
import { Loader2, Mail } from "lucide-react";
import AdminModal from "./AdminModal";

/** Statuses the customer is emailed about (backend/services/notifications.js). */
const EMAILED_STATUSES = ["Processing", "Shipped", "Delivered", "Cancelled"];

const NOTE_EXAMPLES: Record<string, string> = {
  Processing: "e.g. We've added the gift wrap you asked for.",
  Shipped: "e.g. Sent with TCS, tracking number 1234567890.",
  Delivered: "e.g. Left with the building reception.",
  Cancelled: "e.g. The navy colour sold out before we could pack it.",
  Pending: "e.g. Waiting for the customer to confirm the address.",
};

interface StatusChangeModalProps {
  order: { id: number; user_name?: string; user_email?: string; status: string };
  status: string;
  onClose: () => void;
  /** Resolves to true when the change was saved. */
  onConfirm: (note: string, notify: boolean) => Promise<boolean>;
}

/** Confirms an order status change and collects an optional note for the customer. */
export default function StatusChangeModal({ order, status, onClose, onConfirm }: StatusChangeModalProps) {
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);
  const emails = EMAILED_STATUSES.includes(status);
  const customer = order.user_name || "The customer";

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const saved = await onConfirm(note.trim(), emails && notify);
    if (!saved) setSaving(false);
  };

  const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare";
  const button = `inline-flex h-10 items-center justify-center gap-1.5 rounded-control border px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${focusRing}`;

  return (
    <AdminModal
      title={`Mark order #${order.id} as ${status}?`}
      description={
        status === "Cancelled"
          ? "Its items go back into stock."
          : order.status === "Cancelled"
          ? "Its items are taken out of stock again."
          : `It's ${order.status} now.`
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="status-note" className="mb-1.5 block text-sm font-semibold">
            Note for the customer (optional)
          </label>
          <textarea
            id="status-note"
            data-autofocus
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={NOTE_EXAMPLES[status] || ""}
            aria-describedby="status-note-hint"
            className={`w-full resize-none rounded-control border border-line-strong bg-surface p-3 text-base text-ink placeholder:text-muted sm:text-sm ${focusRing}`}
          />
          <p id="status-note-hint" className="mt-1.5 flex justify-between gap-3 text-xs text-muted">
            <span>{emails ? "Shown on their tracking page and in the email." : "Shown on their tracking page."}</span>
            <span className="tabular-nums">{note.length}/500</span>
          </p>
        </div>

        {emails ? (
          <label className="flex cursor-pointer items-start gap-3 rounded-control border border-line p-3">
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-ink"
            />
            <span className="text-sm">
              <span className="flex items-center gap-1.5 font-semibold">
                <Mail size={14} aria-hidden /> Email the customer
              </span>
              <span className="block text-xs text-muted">
                {customer}
                {order.user_email ? ` (${order.user_email})` : ""} gets a "{status}" update.
              </span>
            </span>
          </label>
        ) : (
          <p className="rounded-control bg-porcelain p-3 text-xs text-muted">Customers aren't emailed when an order goes back to {status}.</p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={`${button} border-line-strong bg-surface text-ink hover:bg-porcelain`}>
            Keep it {order.status}
          </button>
          <button
            type="submit"
            disabled={saving}
            className={
              status === "Cancelled"
                ? `${button} border-error bg-surface text-error hover:bg-error-tint`
                : `${button} border-ink bg-ink text-white hover:bg-night`
            }
          >
            {saving && <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden />}
            {status === "Cancelled" ? "Cancel order" : `Mark as ${status}`}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
