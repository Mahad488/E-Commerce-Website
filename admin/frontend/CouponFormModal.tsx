import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Check, DollarSign, Loader2, Percent, Shuffle, Truck } from "lucide-react";
import AdminModal from "./AdminModal";
import { CouponTicket, StatusPill } from "./CouponParts";
import {
  checkCouponInput,
  CouponApiError,
  couponApi,
  defaultDescription,
  formatDay,
  todayISO,
  toInput,
  type Coupon,
  type CouponField,
  type CouponInput,
  type CouponStatus,
  type DiscountType,
  type FieldErrors,
} from "./coupons";

interface CouponFormModalProps {
  /** The coupon to edit, or null to create one. */
  coupon: Coupon | null;
  onClose: () => void;
  onSaved: (coupon: Coupon, created: boolean) => void;
}

const EMPTY: CouponInput = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  min_order: "",
  usage_limit: "",
  expires_at: "",
  active: true,
};

const TYPES: { value: DiscountType; label: string; icon: ReactNode }[] = [
  { value: "percent", label: "Percent off", icon: <Percent size={14} aria-hidden /> },
  { value: "fixed", label: "Amount off", icon: <DollarSign size={14} aria-hidden /> },
  { value: "shipping", label: "Free shipping", icon: <Truck size={14} aria-hidden /> },
];

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flare";
const button = `inline-flex h-10 items-center justify-center gap-1.5 rounded-control border px-4 text-sm font-semibold transition-colors disabled:opacity-50 ${focusRing}`;
const inputClass = (invalid: boolean) =>
  `h-11 w-full rounded-control border bg-surface px-3 text-base text-ink placeholder:text-muted sm:text-sm ${focusRing} ${
    invalid ? "border-error" : "border-line-strong"
  }`;

/** Random, easy-to-read code such as "NOVA-7K2Q" (no 0/O or 1/I). */
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `NOVA-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
}

function previewStatus(input: CouponInput, coupon: Coupon | null): CouponStatus {
  if (input.expires_at && input.expires_at < todayISO()) return "expired";
  if (!input.active) return "paused";
  const limit = Number(input.usage_limit);
  if (coupon && input.usage_limit.trim() && coupon.used_count >= limit) return "used_up";
  return "active";
}

export default function CouponFormModal({ coupon, onClose, onSaved }: CouponFormModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState<CouponInput>(() => (coupon ? toInput(coupon) : EMPTY));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends CouponField>(field: K, value: CouponInput[K]) => {
    setInput((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const showErrors = (found: FieldErrors) => {
    setErrors(found);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = checkCouponInput(input, coupon ?? undefined);
    if (Object.keys(found).length) {
      showErrors(found);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const saved = coupon ? await couponApi.update(coupon.id, input) : await couponApi.create(input);
      onSaved(saved, !coupon);
    } catch (err) {
      if (err instanceof CouponApiError && Object.keys(err.fieldErrors).length) showErrors(err.fieldErrors);
      else setFormError(err instanceof Error ? err.message : "Couldn't save the coupon. Try again.");
      setSaving(false);
    }
  };

  const value = Number(input.discount_value) || 0;
  const minOrder = Number(input.min_order) || 0;
  const autoDescription = defaultDescription(input.discount_type, value, minOrder);
  const keepsPastExpiry = !!coupon && input.expires_at !== "" && input.expires_at === coupon.expires_at;

  const fieldProps = (field: CouponField, hint?: string) => ({
    id: `coupon-${field}`,
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `coupon-${field}-error` : hint ? `coupon-${field}-hint` : undefined,
  });

  return (
    <AdminModal
      title={coupon ? `Edit ${coupon.code}` : "New coupon"}
      description={coupon ? `Used ${coupon.used_count} ${coupon.used_count === 1 ? "time" : "times"} so far.` : "Shoppers enter the code at checkout."}
      onClose={onClose}
      width="sm:max-w-4xl"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
          <Field id="coupon-code" label="Code" error={errors.code} hint="Letters, numbers, dashes or underscores. Saved in capitals.">
            <div className="flex gap-2">
              <input
                {...fieldProps("code", "hint")}
                data-autofocus
                type="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={30}
                placeholder="SUMMER20"
                value={input.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s+/g, ""))}
                className={`${inputClass(!!errors.code)} font-bold tracking-wider font-stretch-semi-condensed`}
              />
              <button
                type="button"
                onClick={() => set("code", generateCode())}
                className={`${button} shrink-0 border-line-strong bg-surface text-ink hover:bg-porcelain`}
              >
                <Shuffle size={14} aria-hidden /> Generate
              </button>
            </div>
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Discount</legend>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((type) => {
                const checked = input.discount_type === type.value;
                return (
                  <label
                    key={type.value}
                    className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-control border px-2 text-center text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-flare ${
                      checked ? "border-flare bg-flare-tint text-flare-press" : "border-line-strong hover:bg-porcelain"
                    }`}
                  >
                    <input
                      type="radio"
                      name="discount_type"
                      value={type.value}
                      checked={checked}
                      onChange={() => set("discount_type", type.value)}
                      className="sr-only"
                    />
                    {checked ? <Check size={14} aria-hidden /> : type.icon}
                    {type.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {input.discount_type === "shipping" ? (
            <p className="rounded-control bg-porcelain p-3 text-sm text-muted">Orders that use this code get free delivery.</p>
          ) : (
            <Field
              id="coupon-discount_value"
              label={input.discount_type === "percent" ? "Percent off" : "Amount off"}
              error={errors.discount_value}
            >
              <Affixed prefix={input.discount_type === "fixed" ? "$" : undefined} suffix={input.discount_type === "percent" ? "%" : undefined}>
                <input
                  {...fieldProps("discount_value")}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={input.discount_type === "percent" ? 100 : undefined}
                  step="0.01"
                  placeholder={input.discount_type === "percent" ? "20" : "15"}
                  value={input.discount_value}
                  onChange={(e) => set("discount_value", e.target.value)}
                  className={`${inputClass(!!errors.discount_value)} tabular-nums ${input.discount_type === "fixed" ? "pl-7" : "pr-8"}`}
                />
              </Affixed>
            </Field>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="coupon-min_order" label="Minimum order" error={errors.min_order} hint="Leave empty for no minimum.">
              <Affixed prefix="$">
                <input
                  {...fieldProps("min_order", "hint")}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  value={input.min_order}
                  onChange={(e) => set("min_order", e.target.value)}
                  className={`${inputClass(!!errors.min_order)} pl-7 tabular-nums`}
                />
              </Affixed>
            </Field>
            <Field id="coupon-usage_limit" label="Usage limit" error={errors.usage_limit} hint="Across all shoppers. Empty = no limit.">
              <input
                {...fieldProps("usage_limit", "hint")}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                placeholder="No limit"
                value={input.usage_limit}
                onChange={(e) => set("usage_limit", e.target.value)}
                className={`${inputClass(!!errors.usage_limit)} tabular-nums`}
              />
            </Field>
          </div>

          <Field
            id="coupon-expires_at"
            label="Last day it works"
            error={errors.expires_at}
            hint={input.expires_at ? "The code stops working at midnight after this day." : "Leave empty for no end date."}
          >
            <div className="flex gap-2">
              <input
                {...fieldProps("expires_at", "hint")}
                type="date"
                min={keepsPastExpiry ? undefined : todayISO()}
                value={input.expires_at}
                onChange={(e) => set("expires_at", e.target.value)}
                className={`${inputClass(!!errors.expires_at)} tabular-nums`}
              />
              {input.expires_at && (
                <button
                  type="button"
                  onClick={() => set("expires_at", "")}
                  className={`${button} shrink-0 border-line-strong bg-surface text-ink hover:bg-porcelain`}
                >
                  No end date
                </button>
              )}
            </div>
          </Field>

          <Field id="coupon-description" label="Description (optional)" error={errors.description} hint={`Shown to shoppers. Empty = "${autoDescription}".`}>
            <input
              {...fieldProps("description", "hint")}
              type="text"
              maxLength={255}
              placeholder={autoDescription}
              value={input.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputClass(!!errors.description)}
            />
          </Field>

          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-control border border-line p-3">
            <span>
              <span className="block text-sm font-semibold">Active</span>
              <span className="block text-xs text-muted">
                {input.active ? "Shoppers can use the code as soon as you save." : "Saved as paused. Resume it any time."}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={input.active}
              onChange={(e) => set("active", e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:duration-150 peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flare"
            />
          </label>

          {formError && (
            <p role="alert" className="flex items-start gap-2 rounded-control bg-error-tint p-3 text-sm font-medium text-error">
              <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={`${button} border-line-strong bg-surface text-ink hover:bg-porcelain`}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className={`${button} border-ink bg-ink text-white hover:bg-night`}>
              {saving && <Loader2 size={14} className="motion-safe:animate-spin" aria-hidden />}
              {saving ? "Saving…" : coupon ? "Save changes" : "Create coupon"}
            </button>
          </div>
        </form>

        <aside className="order-first md:order-last" aria-label="Preview">
          <div className="space-y-3 rounded-tile bg-well p-4 md:sticky md:top-0">
            <p className="text-xs font-semibold text-muted">What shoppers see</p>
            <CouponTicket
              code={input.code}
              type={input.discount_type}
              value={value}
              minOrder={minOrder}
              description={input.description.trim() || autoDescription}
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
              <StatusPill status={previewStatus(input, coupon)} />
              <span>{input.expires_at ? `Ends ${formatDay(input.expires_at)}` : "No end date"}</span>
              <span>{input.usage_limit.trim() ? `Up to ${input.usage_limit} uses` : "No usage limit"}</span>
            </div>
          </div>
        </aside>
      </div>
    </AdminModal>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-error">
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function Affixed({ prefix, suffix, children }: { prefix?: string; suffix?: string; children: ReactNode }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">{prefix}</span>}
      {children}
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{suffix}</span>}
    </div>
  );
}
