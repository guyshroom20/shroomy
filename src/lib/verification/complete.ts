import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { VerificationProvider, VerificationResult } from "./types";

/**
 * Stores a provider's result, then asks the provider to delete what it holds.
 * The database function is idempotent, so the webhook and the user's return
 * can both arrive without harm.
 */
export async function storeResult(provider: VerificationProvider, result: VerificationResult) {
  const { error } = await createAdminClient().rpc("complete_verification_check", {
    p_check_id: result.checkId,
    p_passed: result.passed,
    p_provider_ref: result.providerRef,
    p_birth_date: result.birthDate,
    p_failure_reason: result.failureReason,
  });
  if (error) throw new Error(error.message);
  if (result.providerRef) await provider.cleanup?.(result.providerRef);
}
