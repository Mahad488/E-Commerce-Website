import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { AlertCircle, CalendarClock, Loader2, Pause, Pencil, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "../../src/context/ToastContext";
import AdminModal from "./AdminModal";
import CouponFormModal from "./CouponFormModal";
import { StatusPill } from "./CouponParts";
import { couponApi, couponHeadline, formatDay, money, todayISO, type Coupon } from "./coupons";

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare";
const button = `inline-flex h-10 items-center justify-center gap-1.5 rounded-control border px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${focusRing}`;
const primaryButton = `${button} border-ink bg-ink text-white hover:bg-night`;
const secondaryButton = `${button} border-line-strong bg-surface text-ink hover:bg-porcelain`;
const iconButton = `inline-flex h-10 w-10 items-center justify-center rounded-control text-muted transition-colors hover:bg-porcelain hover:text-ink disabled:opacity-50 ${focusRing}`;

interface LoadResult {
  coupons?: Coupon[];
  error?: string;
}

async function loadCoupons(): Promise<LoadResult> {
  try {
    return { coupons: await couponApi.list() };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load coupons" };
  }
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong. Try again.");

function daysUntil(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  const [ty, tm, td] = todayISO().split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86_400_000);
}

export default function AdminCoupons() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const apply = useCallback((result: LoadResult) => {
    if (result.coupons) {
      setCoupons(result.coupons);
      setLoadError("");
    } else {
      setLoadError(result.error || "Failed to load coupons");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    loadCoupons().then((result) => active && apply(result));
    return () => {
      active = false;
    };
  }, [apply]);

  const refresh = () => {
    setLoading(true);
    loadCoupons().then(apply);
  };

  const stats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((c) => c.status === "active").length,
      paused: coupons.filter((c) => c.status === "paused").length,
      expired: coupons.filter((c) => c.status === "expired").length,
      usedUp: coupons.filter((c) => c.status === "used_up").length,
      uses: coupons.reduce((sum, c) => sum + c.used_count, 0),
    }),
    [coupons]
  );

  const replace = (updated: Coupon) => setCoupons((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const handleSaved = (saved: Coupon, created: boolean) => {
    setCoupons((prev) => (created ? [saved, ...prev] : prev.map((c) => (c.id === saved.id ? saved : c))));
    setEditing(null);
    showToast(created ? `${saved.code} created` : `Changes to ${saved.code} saved`, "success");
  };

  const handleToggle = async (coupon: Coupon) => {
    setPendingId(coupon.id);
    try {
      const updated = await couponApi.setActive(coupon.id, !coupon.active);
      replace(updated);
      showToast(updated.active ? `${updated.code} is live again` : `${updated.code} is paused`, "success");
    } catch (err) {
      showToast(errorText(err), "error");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await couponApi.remove(deleting.id);
      setCoupons((prev) => prev.filter((c) => c.id !== deleting.id));
      showToast(`${deleting.code} deleted`, "info");
      setDeleting(null);
    } catch (err) {
      showToast(errorText(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const pauseInstead = async () => {
    if (!deleting) return;
    const coupon = deleting;
    setDeleting(null);
    await handleToggle(coupon);
  };

  return (
    <section className="space-y-6 text-ink" aria-labelledby="coupons-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="coupons-title" className="text-2xl font-bold tracking-tight">
            Coupons
          </h2>
          <p className="mt-1 text-sm text-muted">Codes shoppers enter at checkout. Paused, expired and used-up codes are refused.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={refresh} disabled={loading} className={secondaryButton}>
            <RefreshCw size={14} className={loading ? "motion-safe:animate-spin" : ""} aria-hidden /> Refresh
          </button>
          <button type="button" onClick={() => setEditing("new")} className={primaryButton}>
            <Plus size={16} aria-hidden /> New coupon
          </button>
        </div>
      </div>

      <dl className="grid divide-y divide-line rounded-tile border border-line bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Stat
          label="Total coupons"
          value={stats.total}
          note={[
            stats.paused && `${stats.paused} paused`,
            stats.expired && `${stats.expired} expired`,
            stats.usedUp && `${stats.usedUp} used up`,
          ]
            .filter(Boolean)
            .join(" · ") || "All of them can be used"}
        />
        <Stat label="Active codes" value={stats.active} note="Shoppers can use these right now" />
        <Stat label="Total times used" value={stats.uses} note="Orders placed with a code" />
      </dl>

      {loadError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-tile bg-error-tint p-4 text-sm text-error">
          <span className="flex items-start gap-2 font-medium">
            <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
            {loadError}
          </span>
          <button type="button" onClick={refresh} className={secondaryButton}>
            Try again
          </button>
        </div>
      )}

      {loading && coupons.length === 0 ? (
        <div className="space-y-2 rounded-tile border border-line bg-surface p-4" aria-busy="true" aria-label="Loading coupons">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-12 rounded-control bg-well motion-safe:animate-pulse" />
          ))}
        </div>
      ) : coupons.length === 0 && !loadError ? (
        <div className="rounded-tile border border-line bg-surface px-6 py-12 text-center">
          <p className="text-lg font-bold">No coupons yet.</p>
          <p className="mt-1 text-sm text-muted">Create a code shoppers can enter at checkout.</p>
          <button type="button" onClick={() => setEditing("new")} className={`${primaryButton} mt-5`}>
            <Plus size={16} aria-hidden /> New coupon
          </button>
        </div>
      ) : (
        coupons.length > 0 && (
          <div className="overflow-x-auto rounded-tile border border-line bg-surface">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="sticky top-0 bg-surface text-left text-xs text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="px-4 py-3 font-semibold">Code</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Discount</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Min order</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Usage</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Ends</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {coupons.map((coupon) => (
                  <CouponRow
                    key={coupon.id}
                    coupon={coupon}
                    pending={pendingId === coupon.id}
                    onToggle={() => handleToggle(coupon)}
                    onEdit={() => setEditing(coupon)}
                    onDelete={() => setDeleting(coupon)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <AnimatePresence>
        {editing && (
          <CouponFormModal
            key={editing === "new" ? "new" : editing.id}
            coupon={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <AdminModal
            key={deleting.id}
            title={`Delete ${deleting.code}?`}
            description="Shoppers won't be able to use it any more. Orders that already used it keep their discount. This can't be undone."
            onClose={() => !deleteBusy && setDeleting(null)}
          >
            {deleting.used_count > 0 && deleting.active && (
              <p className="mb-5 rounded-control bg-warning-tint p-3 text-sm text-warning">
                It has been used {deleting.used_count} {deleting.used_count === 1 ? "time" : "times"}. Pausing it stops new orders and
                keeps it in this list.
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleting(null)} disabled={deleteBusy} className={secondaryButton}>
                Cancel
              </button>
              {deleting.used_count > 0 && deleting.active && (
                <button type="button" onClick={pauseInstead} disabled={deleteBusy} className={secondaryButton}>
                  <Pause size={14} aria-hidden /> Pause instead
                </button>
              )}
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteBusy}
                className={`${button} border-error bg-surface text-error hover:bg-error-tint`}
              >
                {deleteBusy ? <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />}
                Delete coupon
              </button>
            </div>
          </AdminModal>
        )}
      </AnimatePresence>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="p-4 sm:p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-1 text-3xl font-bold leading-none tabular-nums font-stretch-semi-condensed">{value}</dd>
      <dd className="mt-2 text-xs text-muted">{note}</dd>
    </div>
  );
}

interface CouponRowProps {
  coupon: Coupon;
  pending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CouponRow({ coupon, pending, onToggle, onEdit, onDelete }: CouponRowProps) {
  const expired = coupon.status === "expired";
  return (
    <tr className="transition-colors hover:bg-porcelain">
      <td className="px-4 py-3">
        <span className="inline-flex h-7 items-center rounded-tag border border-dashed border-line-strong bg-porcelain px-2 text-sm font-bold tracking-wider font-stretch-semi-condensed">
          {coupon.code}
        </span>
      </td>
      <td className="max-w-64 px-4 py-3">
        <p className="font-semibold">{couponHeadline(coupon.discount_type, coupon.discount_value)}</p>
        {coupon.description && <p className="truncate text-xs text-muted" title={coupon.description}>{coupon.description}</p>}
      </td>
      <td className="px-4 py-3 text-right tabular-nums">
        {coupon.min_order > 0 ? money(coupon.min_order) : <span className="text-muted">None</span>}
      </td>
      <td className="px-4 py-3">
        <UsageMeter used={coupon.used_count} limit={coupon.usage_limit} />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <ExpiryCell day={coupon.expires_at} expired={expired} />
      </td>
      <td className="px-4 py-3">
        <StatusPill status={coupon.status} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {expired ? (
            <button type="button" onClick={onEdit} className={`${secondaryButton} h-9 px-3`} aria-label={`Change the end date of ${coupon.code}`}>
              <CalendarClock size={14} aria-hidden /> Extend
            </button>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              disabled={pending}
              aria-label={`${coupon.active ? "Pause" : "Resume"} ${coupon.code}`}
              className={`${secondaryButton} h-9 w-28 px-3`}
            >
              {pending ? (
                <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden />
              ) : coupon.active ? (
                <Pause size={14} aria-hidden />
              ) : (
                <Play size={14} aria-hidden />
              )}
              {coupon.active ? "Pause" : "Resume"}
            </button>
          )}
          <button type="button" onClick={onEdit} className={iconButton} aria-label={`Edit ${coupon.code}`} title="Edit">
            <Pencil size={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={`${iconButton} hover:bg-error-tint hover:text-error`}
            aria-label={`Delete ${coupon.code}`}
            title="Delete"
          >
            <Trash2 size={16} aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}

function UsageMeter({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) {
    return (
      <p className="whitespace-nowrap tabular-nums">
        {used} {used === 1 ? "use" : "uses"} <span className="text-muted">· no limit</span>
      </p>
    );
  }
  const ratio = Math.min(1, used / limit);
  return (
    <div className="w-32">
      <p className="whitespace-nowrap tabular-nums">
        {used} / {limit} uses
      </p>
      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-well" aria-hidden>
        <span
          className={`block h-full origin-left ${ratio >= 1 ? "bg-warning" : "bg-ink"}`}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
    </div>
  );
}

function ExpiryCell({ day, expired }: { day: string | null; expired: boolean }) {
  if (!day) return <span className="text-muted">Never</span>;
  const days = daysUntil(day);
  const note = expired ? "Ended" : days === 0 ? "Last day today" : days === 1 ? "Ends tomorrow" : days <= 14 ? `${days} days left` : "";
  return (
    <div>
      <p className="tabular-nums">{formatDay(day)}</p>
      {note && <p className={`text-xs ${expired ? "text-error" : "text-warning"}`}>{note}</p>}
    </div>
  );
}
