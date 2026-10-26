import type { CheckKind, VerificationProvider } from "./types";

/**
 * Development stand-in. Sends the user to /verify/stub, where they pick the
 * outcome. Refuses to run in production unless ALLOW_STUB_VERIFICATION=true.
 */
export const stubProvider: VerificationProvider = {
  id: "stub",
  async createSession({ checkId, kind, returnUrl }) {
    const params = new URLSearchParams({ check: checkId, kind, return: returnUrl });
    return { redirectUrl: `/verify/stub?${params}` };
  },
  async parseWebhook() {
    // The stub page completes checks itself, so it never sends webhooks.
    return null;
  },
};

export function stubAllowed() {
  return process.env.NODE_ENV !== "production" || process.env.ALLOW_STUB_VERIFICATION === "true";
}

function notConfigured(id: string): VerificationProvider {
  const fail = () => {
    throw new Error(`The ${id} integration isn't built yet. Set the provider to "stub" until the contract and API keys are in place.`);
  };
  return { id, createSession: fail, parseWebhook: fail };
}

// Advertisers: document + liveness check. Yoti IDV (or OneID) once signed up.
// Implement createSession with their sessions API, and parseWebhook by
// checking the signature, then fetching the session result for the date of birth.
export const yotiProvider = notConfigured("yoti");

// Visitors: age assurance. VerifyMy (or Yoti age estimation) once signed up.
export const verifyMyProvider = notConfigured("verifymy");

const providers: Record<string, VerificationProvider> = {
  stub: stubProvider,
  yoti: yotiProvider,
  verifymy: verifyMyProvider,
};

export function getProvider(id: string): VerificationProvider | undefined {
  return providers[id];
}

/** The provider configured for each kind of check. */
export function providerFor(kind: CheckKind): VerificationProvider {
  const id =
    kind === "id_verification"
      ? process.env.ID_VERIFICATION_PROVIDER ?? "stub"
      : process.env.AGE_ASSURANCE_PROVIDER ?? "stub";
  const provider = getProvider(id);
  if (!provider) throw new Error(`Unknown verification provider "${id}"`);
  if (provider.id === "stub" && !stubAllowed()) throw new Error("Stub verification is disabled in production");
  return provider;
}
