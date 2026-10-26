import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Matches DEVICE_COOKIE in lib/onboarding/signals.ts, which can't be imported here (server-only).
const DEVICE_COOKIE = "shroom_device";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  // A random id per browser, so moderators can see when several advertiser
  // accounts are run from one device. Never shared outside shroom.
  if (!request.cookies.has(DEVICE_COOKIE)) {
    response.cookies.set(DEVICE_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
    });
  }
  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
