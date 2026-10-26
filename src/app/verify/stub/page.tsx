import { notFound, redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { stubAllowed } from "@/lib/verification/providers";

export const metadata = { title: "Test verification · shroom" };
// Per-user page: never prerender.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ check?: string; kind?: string; return?: string }> };

// Stand-in for the provider's hosted flow while there's no contract with
// Yoti / VerifyMy. Lets you pass or fail a check by hand.
export default async function StubVerificationPage({ searchParams }: Props) {
  if (!stubAllowed()) notFound();
  const { check, kind, return: returnUrl = "/" } = await searchParams;
  const account = await requireAccount("/");
  if (!check) notFound();

  async function complete(form: FormData) {
    "use server";
    if (!stubAllowed()) notFound();
    const me = await requireAccount("/");
    const admin = createAdminClient();
    const { data: row } = await admin.from("verification_checks").select("account_id").eq("id", check!).single();
    if (row?.account_id !== me.id) notFound();

    const outcome = String(form.get("outcome"));
    const adult = new Date();
    adult.setFullYear(adult.getFullYear() - 25);
    const minor = new Date();
    minor.setFullYear(minor.getFullYear() - 16);

    await admin.rpc("complete_verification_check", {
      p_check_id: check!,
      p_passed: outcome !== "fail",
      p_provider_ref: `stub-${check}`,
      p_birth_date: outcome === "pass" ? adult.toISOString().slice(0, 10) : outcome === "minor" ? minor.toISOString().slice(0, 10) : undefined,
      p_failure_reason: outcome === "fail" ? "stub_failed" : undefined,
    });
    // Only ever send the user back into this site.
    const back = new URL(returnUrl, "http://local");
    redirect(`${back.pathname}${back.search}`);
  }

  return (
    <main className="flex flex-1 flex-col px-5 pt-10 pb-safe">
      <p className="text-[13px] uppercase tracking-[0.12em] text-like">Test mode</p>
      <h1 className="mt-3 text-[34px] font-medium leading-[1.05] tracking-[-0.04em]">
        {kind === "id_verification" ? "ID verification" : "Age check"}
      </h1>
      <p className="mt-3 text-[15px] text-fg-muted">
        This screen stands in for the real provider, which will check {account.display_name ?? "the user"}&apos;s ID or age.
        Choose the result to send back.
      </p>
      <form action={complete} className="mt-8 space-y-3">
        <button name="outcome" value="pass" className="w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg">
          Pass (aged 25)
        </button>
        <button name="outcome" value="fail" className="w-full rounded-full bg-surface-2 py-4 text-[16px]">
          Fail
        </button>
        {kind === "id_verification" && (
          <button name="outcome" value="minor" className="w-full rounded-full bg-surface-2 py-4 text-[16px] text-like">
            Under 18 (aged 16)
          </button>
        )}
      </form>
    </main>
  );
}
