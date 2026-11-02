import type { Location } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import type { AuthUser } from "../context/AuthContext";

/** Seeded by `npm run db:setup` (backend/database/seed.js). */
export const DEMO_CREDENTIALS = { email: "demo@nova.store", password: "Demo@1234" };

export interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  token?: string;
  message?: string;
  network?: boolean;
}

export async function loginRequest(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await response.json();
    if (!response.ok || !data.token || !data.user) {
      return { ok: false, message: data.message || "Invalid email or password." };
    }
    return { ok: true, user: data.user, token: data.token };
  } catch {
    return {
      ok: false,
      network: true,
      message: "Can't reach the server. Make sure the backend is running (cd backend && npm run dev).",
    };
  }
}

/**
 * Where to go after signing in: the page that sent the shopper to /login
 * (via router state or ?redirect=), falling back to the account page.
 * Only same-site paths are allowed, to avoid open redirects.
 */
export function getRedirectTarget(location: Location, fallback = "/account"): string {
  const fromState = (location.state as { from?: string } | null)?.from;
  const fromQuery = new URLSearchParams(location.search).get("redirect");
  const target = fromState || fromQuery || fallback;
  return target.startsWith("/") && !target.startsWith("//") ? target : fallback;
}
