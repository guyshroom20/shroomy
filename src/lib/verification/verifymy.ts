import "server-only";
import { hmacHex } from "./secrets";
import type { VerificationProvider, VerificationResult } from "./types";

// Sandbox: https://sandbox.verifymyage.com. Keys differ between the two.
const apiUrl = () => process.env.VERIFYMY_API_URL ?? "https://oauth.verifymyage.com";

type Verification = {
  id?: string;
  verification_id?: string;
  user_id?: string;
  status?: "started" | "pending" | "approved" | "failed" | "expired";
  verification_status?: string;
  start_verification_url?: string;
  threshold?: number;
};

/**
 * Calls the VerifyMy API. Every request is signed with HMAC-SHA256 under the
 * API secret: the JSON body for a POST, the request path for a GET.
 */
async function call(method: "GET" | "POST", path: string, body?: object): Promise<Verification> {
  const key = process.env.VERIFYMY_API_KEY;
  const secret = process.env.VERIFYMY_API_SECRET;
  if (!key || !secret) throw new Error("Set VERIFYMY_API_KEY and VERIFYMY_API_SECRET to use VerifyMy");
  const payload = body ? JSON.stringify(body) : undefined;
  const res = await fetch(`${apiUrl()}${path}`, {
    method,
    headers: {
      Authorization: `hmac ${key}:${hmacHex(secret, payload ?? path)}`,
      "Content-Type": "application/json",
    },
    body: payload,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`VerifyMy ${method} ${path} failed: ${res.status}`);
  return res.json();
}

async function fetchResult(verificationId: string): Promise<VerificationResult | null> {
  if (!/^[\w-]{6,80}$/.test(verificationId)) return null;
  const v = await call("GET", `/api/v3/verifications/${verificationId}`);
  // user_id is the external_user_id we sent: our check id.
  if (!v.user_id) return null;
  const base = { checkId: v.user_id, providerRef: verificationId };
  if (v.status === "approved") {
    // Belt and braces: the threshold is set in the business settings, but must be at least 18.
    return (v.threshold ?? 18) >= 18 ? { ...base, passed: true } : { ...base, passed: false, failureReason: "threshold_below_18" };
  }
  if (v.status === "failed" || v.status === "expired") return { ...base, passed: false, failureReason: v.status };
  return null;
}

/**
 * Visitors: VerifyMy age assurance. The visitor picks a method on VerifyMy's
 * page (face age estimation, email, ID scan, mobile, card) and comes back to
 * /api/verification/return/verifymy with a verification_id.
 */
export const verifyMyProvider: VerificationProvider = {
  id: "verifymy",

  async createSession({ checkId, returnUrl, webhookUrl }) {
    const origin = new URL(returnUrl).origin;
    // This URL must be registered in the VerifyMy dashboard. The page to land
    // on afterwards is kept in a cookie by /api/verification/start.
    const redirect = `${origin}/api/verification/return/verifymy`;
    const v = await call("POST", "/api/v3/verifications", {
      redirect_url: redirect,
      country: "gb",
      external_user_id: checkId,
      ...(process.env.VERIFYMY_BUSINESS_SETTINGS_ID && { business_settings_id: process.env.VERIFYMY_BUSINESS_SETTINGS_ID }),
      ...(webhookUrl.startsWith("https://") && { webhook: webhookUrl }),
    });
    const id = v.verification_id ?? v.id;
    if (!id) throw new Error("VerifyMy didn't return a verification id");
    const redirectUrl = v.start_verification_url ?? `${redirect}?verification_id=${encodeURIComponent(id)}`;
    return { redirectUrl, providerRef: id };
  },

  // VerifyMy doesn't document how its webhooks are signed, so the body is only
  // used for the verification id; the result itself is read back from the API.
  async parseWebhook(request) {
    const body = (await request.json().catch(() => null)) as Verification | null;
    const id = body?.id ?? body?.verification_id;
    if (!id) return null;
    const result = await fetchResult(id).catch(() => null);
    return result ?? "ignore";
  },

  fetchResult,
};
