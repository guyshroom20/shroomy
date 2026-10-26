import "server-only";
import { readFileSync } from "node:fs";
import {
  IDVClient,
  NotificationConfigBuilder,
  RequestedDocumentAuthenticityCheckBuilder,
  RequestedFaceMatchCheckBuilder,
  RequestedLivenessCheckBuilder,
  RequestedTextExtractionTaskBuilder,
  RequiredIdDocumentBuilder,
  SdkConfigBuilder,
  SessionSpecificationBuilder,
} from "yoti";
import { bearerMatches } from "./secrets";
import type { VerificationProvider, VerificationResult } from "./types";

/** Yoti's hosted capture screens, loaded in an iframe on /verify/yoti. */
export const YOTI_IFRAME_URL = `${process.env.YOTI_IDV_API_URL ?? "https://api.yoti.com/idverify/v1"}/web/index.html`;

// A pass needs every one of these to come back APPROVE.
const REQUIRED_CHECKS = ["ID_DOCUMENT_AUTHENTICITY", "LIVENESS", "ID_DOCUMENT_FACE_MATCH"] as const;

let client: IDVClient | undefined;

function idvClient() {
  if (client) return client;
  const sdkId = process.env.YOTI_CLIENT_SDK_ID;
  // YOTI_PEM holds the key itself (for hosting), YOTI_KEY_FILE_PATH points at the file (for local use).
  const pem = process.env.YOTI_PEM?.replace(/\\n/g, "\n") ?? (process.env.YOTI_KEY_FILE_PATH && readFileSync(process.env.YOTI_KEY_FILE_PATH));
  if (!sdkId || !pem) throw new Error("Set YOTI_CLIENT_SDK_ID and YOTI_PEM (or YOTI_KEY_FILE_PATH) to use Yoti");
  // The SDK reads YOTI_IDV_API_URL itself, so the sandbox works by setting that variable.
  client = new IDVClient(sdkId, pem);
  return client;
}

async function readBirthDate(sessionId: string, mediaIds: string[]) {
  for (const mediaId of mediaIds) {
    const media = await idvClient().getMediaContent(sessionId, mediaId);
    if (!media) continue;
    const fields = JSON.parse(media.getContent().toString("utf8")) as { date_of_birth?: string };
    if (fields.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(fields.date_of_birth)) return fields.date_of_birth;
  }
  return undefined;
}

/** Reads a finished session. Null while the person is still going through it. */
async function fetchResult(sessionId: string): Promise<VerificationResult | null> {
  const session = await idvClient().getSession(sessionId);
  const checkId = session.getUserTrackingId();
  const state = session.getState();
  if (state === "EXPIRED") return { checkId, passed: false, providerRef: sessionId, failureReason: "expired" };
  if (state !== "COMPLETED") return null;

  const checks = session.getChecks();
  const recommendation = (type: string) =>
    checks.filter((c) => c.getType() === type).map((c) => c.getReport()?.getRecommendation()).filter((r) => r);

  for (const type of REQUIRED_CHECKS) {
    const results = recommendation(type);
    // Liveness allows retries, so one approved attempt is enough. A rejected document is never fine.
    const approved = results.some((r) => r!.getValue() === "APPROVE");
    const rejectedDocument = type === "ID_DOCUMENT_AUTHENTICITY" && results.some((r) => r!.getValue() === "REJECT");
    if (!approved || rejectedDocument) {
      const failed = results.find((r) => r!.getValue() !== "APPROVE");
      const why = failed ? (failed.getReason() ?? failed.getValue()) : "not_completed";
      return { checkId, passed: false, providerRef: sessionId, failureReason: `${type.toLowerCase()}: ${why}`.slice(0, 200) };
    }
  }

  const mediaIds = (session.getResources()?.getIdDocuments() ?? [])
    .map((doc) => doc.getDocumentFields()?.getMedia()?.getId())
    .filter((id): id is string => Boolean(id));
  const birthDate = await readBirthDate(sessionId, mediaIds);
  return { checkId, passed: true, providerRef: sessionId, birthDate };
}

/**
 * Advertisers: Yoti Identity Verification. One session checks the document is
 * genuine, that a live person is in front of the camera, and that their face
 * matches the document photo. Camera only, no uploads, so edited images can't be used.
 */
export const yotiProvider: VerificationProvider = {
  id: "yoti",

  async createSession({ checkId, returnUrl, webhookUrl }) {
    const ttl = 900;
    const spec = new SessionSpecificationBuilder()
      .withClientSessionTokenTtl(ttl)
      // Yoti's minimum: the session plus a day. Media is deleted sooner, once we have the result.
      .withResourcesTtl(ttl + 86_400)
      // Our check id, not anything personal.
      .withUserTrackingId(checkId)
      .withRequestedCheck(new RequestedDocumentAuthenticityCheckBuilder().withManualCheckFallback().build())
      .withRequestedCheck(new RequestedLivenessCheckBuilder().forStaticLiveness().withMaxRetries(3).build())
      .withRequestedCheck(new RequestedFaceMatchCheckBuilder().withManualCheckFallback().build())
      .withRequestedTask(new RequestedTextExtractionTaskBuilder().withManualCheckFallback().build())
      .withRequiredDocument(new RequiredIdDocumentBuilder().build())
      .withSdkConfig(
        new SdkConfigBuilder()
          .withAllowsCamera()
          .withLocale("en-GB")
          .withPresetIssuingCountry("GBR")
          .withEarlyBiometricConsentFlow()
          .build(),
      );

    // Yoti only posts to HTTPS, so local development relies on fetchResult instead.
    const secret = process.env.VERIFICATION_WEBHOOK_SECRET;
    if (webhookUrl.startsWith("https://") && secret) {
      spec.withNotifications(
        new NotificationConfigBuilder()
          .withEndpoint(webhookUrl)
          .withAuthToken(secret)
          .withAuthTypeBearer()
          .forSessionCompletion()
          .build(),
      );
    }

    const session = await idvClient().createSession(spec.build());
    const back = new URL(returnUrl);
    const params = new URLSearchParams({
      check: checkId,
      session: session.getSessionId(),
      token: session.getClientSessionToken(),
      return: `${back.pathname}${back.search}`,
    });
    return { redirectUrl: `/verify/yoti?${params}`, providerRef: session.getSessionId() };
  },

  async parseWebhook(request) {
    const secret = process.env.VERIFICATION_WEBHOOK_SECRET;
    if (!secret || !bearerMatches(request.headers.get("authorization"), secret)) return null;
    const body = (await request.json().catch(() => null)) as { session_id?: string; topic?: string } | null;
    if (!body?.session_id) return null;
    // Configured as SESSION_COMPLETION, delivered as session_completion.
    if (body.topic?.toLowerCase() !== "session_completion") return "ignore";
    return (await fetchResult(body.session_id)) ?? "ignore";
  },

  fetchResult,

  async cleanup(sessionId) {
    try {
      await idvClient().deleteSession(sessionId);
    } catch (error) {
      // Yoti still deletes it when resources_ttl runs out, so log and move on.
      console.error("Couldn't delete Yoti session", sessionId, error);
    }
  },
};
