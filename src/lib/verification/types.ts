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
  /**
   * Checks the webhook is genuine and reads the result. Returns null when the
   * request isn't genuine, and "ignore" for a genuine update that isn't a final result.
   */
  parseWebhook(request: Request): Promise<VerificationResult | "ignore" | null>;
  /**
   * Asks the provider for the result directly, for when the user comes back
   * before (or without) the webhook. Null while the check is still running.
   */
  fetchResult?(providerRef: string): Promise<VerificationResult | null>;
  /** Deletes what the provider holds (documents, selfies) once the result is stored. */
  cleanup?(providerRef: string): Promise<void>;
}
