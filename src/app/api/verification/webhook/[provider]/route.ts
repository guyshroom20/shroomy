import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProvider } from "@/lib/verification/providers";

// Result callback from the ID / age provider. The provider adapter checks the
// signature; the database function is idempotent, so retries are safe.
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = getProvider((await params).provider);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const result = await provider.parseWebhook(request);
  if (!result) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const { error } = await createAdminClient().rpc("complete_verification_check", {
    p_check_id: result.checkId,
    p_passed: result.passed,
    p_provider_ref: result.providerRef,
    p_birth_date: result.birthDate,
    p_failure_reason: result.failureReason,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
