import { API_BASE_URL } from "../../src/config/api";

export type DiscountType = "percent" | "fixed" | "shipping";
export type CouponStatus = "active" | "paused" | "expired" | "used_up";

/** A coupon as GET /api/admin/coupons returns it. */
export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  min_order: number;
  usage_limit: number | null;
  used_count: number;
  /** Last day the code works, "YYYY-MM-DD", or null for no expiry. */
  expires_at: string | null;
  active: boolean;
  status: CouponStatus;
  created_at: string;
}

/** What the create / edit form sends. Empty strings mean "none". */
export interface CouponInput {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  min_order: string;
  usage_limit: string;
  expires_at: string;
  active: boolean;
}

export type CouponField = keyof CouponInput;
export type FieldErrors = Partial<Record<CouponField, string>>;

export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "Save 20%", "Save $15" or "Free shipping". */
export function couponHeadline(type: DiscountType, value: number): string {
  if (type === "shipping") return "Free shipping";
  return `Save ${type === "percent" ? `${value || 0}%` : money(value || 0)}`;
}

/** "on orders above $100" or "on any order". */
export function couponCondition(minOrder: number): string {
  return minOrder > 0 ? `on orders above ${money(minOrder)}` : "on any order";
}

/** Matches the description the API writes when the admin leaves it empty. */
export function defaultDescription(type: DiscountType, value: number, minOrder: number): string {
  const where = minOrder > 0 ? `orders over ${money(minOrder)}` : "any order";
  if (type === "shipping") return `Free shipping on ${where}`;
  return `${type === "percent" ? `${value || 0}%` : money(value || 0)} off ${where}`;
}

/** "31 Jan 2027" from "2027-01-31". */
export function formatDay(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function toInput(coupon: Coupon): CouponInput {
  // A description the API wrote itself stays automatic, so it follows edits to the discount.
  const automatic = coupon.description === defaultDescription(coupon.discount_type, coupon.discount_value, coupon.min_order);
  return {
    code: coupon.code,
    description: automatic ? "" : coupon.description ?? "",
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_type === "shipping" ? "" : String(coupon.discount_value),
    min_order: coupon.min_order > 0 ? String(coupon.min_order) : "",
    usage_limit: coupon.usage_limit === null ? "" : String(coupon.usage_limit),
    expires_at: coupon.expires_at ?? "",
    active: coupon.active,
  };
}

/** Same rules as backend/admin/adminCoupons.js, so most mistakes show before saving. */
export function checkCouponInput(input: CouponInput, existing?: Coupon): FieldErrors {
  const errors: FieldErrors = {};
  if (!/^[A-Z0-9][A-Z0-9_-]{2,29}$/.test(input.code.trim().toUpperCase())) {
    errors.code = "Use 3–30 letters or numbers (dashes and underscores are fine).";
  }
  const value = Number(input.discount_value);
  if (input.discount_type === "percent" && !(value > 0 && value <= 100)) {
    errors.discount_value = "Enter a percentage between 1 and 100.";
  }
  if (input.discount_type === "fixed" && !(value > 0 && value <= 100000)) {
    errors.discount_value = "Enter an amount greater than $0.";
  }
  if (input.min_order.trim() && !(Number(input.min_order) >= 0)) {
    errors.min_order = "Enter a minimum order of $0 or more, or leave it empty.";
  }
  const limit = Number(input.usage_limit);
  if (input.usage_limit.trim() && !(Number.isInteger(limit) && limit >= 1)) {
    errors.usage_limit = "Enter a whole number of uses (1 or more), or leave it empty.";
  }
  if (input.expires_at && input.expires_at < todayISO() && input.expires_at !== existing?.expires_at) {
    errors.expires_at = "Pick today or a later date, or leave it empty for no expiry.";
  }
  if (input.description.length > 255) {
    errors.description = "Keep the description under 255 characters.";
  }
  return errors;
}

/** Thrown for any failed request; `fieldErrors` holds the API's per-field messages. */
export class CouponApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface ApiBody {
  success?: boolean;
  message?: string;
  errors?: FieldErrors;
  coupon?: Coupon;
  coupons?: Coupon[];
}

async function request(path: string, init: RequestInit = {}): Promise<ApiBody> {
  const token = localStorage.getItem("nova_admin_token");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/admin/coupons${path}`, {
      ...init,
      headers: {
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new CouponApiError("Couldn't reach the API. Check that the backend is running, then try again.", 0);
  }
  const body = (await res.json().catch(() => ({}))) as ApiBody;
  if (res.status === 401 || res.status === 403) {
    throw new CouponApiError("Your admin session has expired. Sign in again.", res.status);
  }
  if (!res.ok || !body.success) {
    throw new CouponApiError(body.message || `Request failed (error ${res.status}).`, res.status, body.errors);
  }
  return body;
}

function toBody(input: CouponInput) {
  return JSON.stringify({
    ...input,
    code: input.code.trim().toUpperCase(),
    description: input.description.trim(),
    discount_value: input.discount_type === "shipping" ? 0 : Number(input.discount_value),
    min_order: input.min_order.trim() ? Number(input.min_order) : null,
    usage_limit: input.usage_limit.trim() ? Number(input.usage_limit) : null,
    expires_at: input.expires_at || null,
  });
}

export const couponApi = {
  list: async () => (await request("")).coupons ?? [],
  create: async (input: CouponInput) => (await request("", { method: "POST", body: toBody(input) })).coupon as Coupon,
  update: async (id: number, input: CouponInput) =>
    (await request(`/${id}`, { method: "PUT", body: toBody(input) })).coupon as Coupon,
  setActive: async (id: number, active: boolean) =>
    (await request(`/${id}/toggle`, { method: "PATCH", body: JSON.stringify({ active }) })).coupon as Coupon,
  remove: async (id: number) => {
    await request(`/${id}`, { method: "DELETE" });
  },
};
