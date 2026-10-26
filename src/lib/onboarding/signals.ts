import "server-only";
import { cookies } from "next/headers";
import type { Enums } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { hmacHex } from "@/lib/verification/secrets";

/** Long-lived random id for this browser, set by the middleware. */
export const DEVICE_COOKIE = "shroom_device";

function hashSecret() {
  const secret = process.env.SIGNAL_HASH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") throw new Error("SIGNAL_HASH_SECRET is not set");
  return "development-only";
}

/** UK and international numbers in E.164 form (+447911123456), or null if it doesn't look like a phone number. */
export function normalisePhone(input: string) {
  let n = input.replace(/[\s().-]/g, "");
  if (n.startsWith("00")) n = `+${n.slice(2)}`;
  else if (n.startsWith("0")) n = `+44${n.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(n) ? n : null;
}

/**
 * Stores a keyed hash of a phone number, device or card against the account.
 * The database flags it for moderators when another advertiser shares it.
 */
export async function recordSignal(accountId: string, kind: Enums<"signal_kind">, value: string) {
  const { error } = await createAdminClient().rpc("record_account_signal", {
    p_account_id: accountId,
    p_kind: kind,
    p_hash: hmacHex(hashSecret(), `${kind}:${value}`),
  });
  if (error) throw new Error(error.message);
}

/** Records the current browser's device id, if it has one. */
export async function recordDevice(accountId: string) {
  const device = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (device && /^[0-9a-f-]{36}$/.test(device)) await recordSignal(accountId, "device", device);
}
