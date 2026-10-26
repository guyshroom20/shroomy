import type { Enums } from "@/lib/supabase/database.types";

export type CheckKind = Enums<"check_kind">;

export type VerificationResult = {
  checkId: string;
  passed: boolean;
  providerRef?: string;
  /** ISO date (YYYY-MM-DD). Required for a passed ID check. */
  birthDate?: string;
  failureReason?: string;
};

/**
 * An outside ID-verification or age-assurance service. We send the user to
 * the provider's hosted flow and hear back by webhook. Documents and selfies
 * stay with the provider; we only store the outcome.
 */
export interface VerificationProvider {
  id: string;
  createSession(input: {
    checkId: string;
    kind: CheckKind;
    /** Where the provider sends the user when they finish. */
    returnUrl: string;
    /** Where the provider posts the result. */
    webhookUrl: string;
  }): Promise<{ redirectUrl: string; providerRef?: string }>;
  /** Checks the webhook's signature and reads the result. Returns null when the request isn't genuine. */
  parseWebhook(request: Request): Promise<VerificationResult | null>;
}
