import { ShieldCheck } from "lucide-react";
import { requireAccount } from "@/lib/auth";

export const metadata = { title: "Confirm your age · shroom" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function AgeCheckPage({ searchParams }: Props) {
  const { next = "/" } = await searchParams;
  const back = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  await requireAccount(`/verify/age?next=${encodeURIComponent(back)}`);
  return (
    <main className="flex flex-1 flex-col px-5 pt-10 pb-safe">
      <ShieldCheck className="size-10 text-verified" />
      <h1 className="mt-6 text-[34px] font-medium leading-[1.05] tracking-[-0.04em]">Confirm you&apos;re 18+</h1>
      <p className="mt-3 text-[15px] text-fg-muted">
        UK law requires a quick age check before you can message advertisers or see locked photos. It&apos;s done by a
        verification partner and takes about a minute. We only keep the result, never your documents or face scan.
      </p>
      <form action="/api/verification/start" method="post" className="mt-auto pt-10">
        <input type="hidden" name="kind" value="age_assurance" />
        <input type="hidden" name="return" value={back} />
        <button className="w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg">Start age check</button>
      </form>
    </main>
  );
}
