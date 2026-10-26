import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Compares two strings in constant time. */
export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** True when an Authorization header is exactly "Bearer <secret>". */
export function bearerMatches(header: string | null, secret: string) {
  return Boolean(header) && safeEqual(header!, `Bearer ${secret}`);
}

export function hmacHex(secret: string, data: string) {
  return createHmac("sha256", secret).update(data).digest("hex");
}
