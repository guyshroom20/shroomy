import { NextResponse, type NextRequest } from "next/server";
import { getAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeResult } from "@/lib/verification/complete";
import { getProvider } from "@/lib/verification/providers";
import { RETURN_COOKIE } from "@/lib/verification/return";

// Where the user lands after the provider's flow. Rather than wait for the
// webhook, ask the provider for the result straight away, then send the user
// back to the page they started from.
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const origin = request.nextUrl.origin;
  const back = request.cookies.get(RETURN_COOKIE)?.value ?? "/";
  const done = () => {
    const res = NextResponse.redirect(new URL(back.startsWith("/") && !back.startsWith("//") ? back : "/", origin), 303);
    res.cookies.delete(RETURN_COOKIE);
    return res;
  };

  const provider = getProvider((await params).provider);
  const account = await getAccount();
  if (!provider?.fetchResult || !account) return done();

  // Yoti comes back with our check id, VerifyMy with its verification id.
  const q = request.nextUrl.searchParams;
  let providerRef = q.get("verification_id");
  const checkId = q.get("check");
  if (checkId) {
    const { data: check } = await createAdminClient()
      .from("verification_checks")
      .select("provider_ref")
      .eq("id", checkId)
      .eq("account_id", account.id)
      .eq("provider", provider.id)
      .maybeSingle();
    providerRef = check?.provider_ref ?? null;
  }
  if (!providerRef) return done();

  try {
    const result = await provider.fetchResult(providerRef);
    if (result) await storeResult(provider, result);
  } catch (error) {
    // The webhook will still deliver it; the page shows the check as in progress.
    console.error("Couldn't read the verification result", error);
  }
  return done();
}
