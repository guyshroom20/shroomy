import { NextResponse, type NextRequest } from "next/server";
import { getAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { providerFor } from "@/lib/verification/providers";
import { RETURN_COOKIE } from "@/lib/verification/return";
import type { CheckKind } from "@/lib/verification/types";

// Starts an ID check (advertisers) or age check (visitors) and sends the
// user to the provider. Posted from a plain form, so it answers with a redirect.
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const form = await request.formData();
  const kind: CheckKind = form.get("kind") === "id_verification" ? "id_verification" : "age_assurance";
  const back = String(form.get("return") ?? "/");
  const returnPath = back.startsWith("/") && !back.startsWith("//") ? back : "/";

  const account = await getAccount();
  if (!account) {
    return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(returnPath)}`, origin), 303);
  }
  if (kind === "id_verification" && account.role !== "advertiser") {
    return NextResponse.json({ error: "ID verification is for advertisers" }, { status: 403 });
  }
  const done = kind === "id_verification" ? account.id_verification : account.age_assurance;
  if (done === "passed") return NextResponse.redirect(new URL(returnPath, origin), 303);

  const provider = providerFor(kind);
  const admin = createAdminClient();
  const { data: checkId, error } = await admin.rpc("begin_verification_check", {
    p_account_id: account.id,
    p_kind: kind,
    p_provider: provider.id,
  });
  if (error || !checkId) return NextResponse.json({ error: "Couldn't start the check" }, { status: 500 });

  const session = await provider.createSession({
    checkId,
    kind,
    returnUrl: new URL(returnPath, origin).toString(),
    webhookUrl: new URL(`/api/verification/webhook/${provider.id}`, origin).toString(),
  });
  if (session.providerRef) {
    await admin.from("verification_checks").update({ provider_ref: session.providerRef }).eq("id", checkId);
  }
  const res = NextResponse.redirect(new URL(session.redirectUrl, origin), 303);
  res.cookies.set(RETURN_COOKIE, returnPath, { httpOnly: true, sameSite: "lax", secure: origin.startsWith("https"), maxAge: 3600, path: "/" });
  return res;
}
