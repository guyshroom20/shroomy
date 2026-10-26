import { NextResponse, type NextRequest } from "next/server";
import { storeResult } from "@/lib/verification/complete";
import { getProvider } from "@/lib/verification/providers";

// Result callback from the ID / age provider. The provider adapter checks the
// webhook is genuine; storing the result is idempotent, so retries are safe.
export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const provider = getProvider((await params).provider);
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 404 });

  const result = await provider.parseWebhook(request);
  if (!result) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  if (result === "ignore") return NextResponse.json({ ok: true });

  try {
    await storeResult(provider, result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Couldn't store the result" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
