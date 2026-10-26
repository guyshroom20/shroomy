import { notFound } from "next/navigation";
import { YotiFrame } from "@/components/verification/YotiFrame";
import { requireAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { YOTI_IFRAME_URL } from "@/lib/verification/yoti";

export const metadata = { title: "Verify your ID · shroom" };
// Per-user page: never prerender.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ check?: string; session?: string; token?: string; return?: string }> };

// Hosts Yoti's capture screens (document, liveness, face match) in an iframe.
export default async function YotiVerificationPage({ searchParams }: Props) {
  const { check, session, token, return: back = "/" } = await searchParams;
  const account = await requireAccount("/onboarding");
  if (!check || !session || !token) notFound();

  const { data: row } = await createAdminClient()
    .from("verification_checks")
    .select("provider_ref, status")
    .eq("id", check)
    .eq("account_id", account.id)
    .eq("provider", "yoti")
    .maybeSingle();
  if (!row || row.provider_ref !== session) notFound();

  const src = `${YOTI_IFRAME_URL}?${new URLSearchParams({ sessionID: session, sessionToken: token })}`;
  return (
    <main className="flex flex-1 flex-col">
      <YotiFrame
        src={src}
        doneUrl={`/api/verification/return/yoti?${new URLSearchParams({ check })}`}
        backUrl={back.startsWith("/") && !back.startsWith("//") ? back : "/"}
      />
    </main>
  );
}
