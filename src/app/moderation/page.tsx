import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireAccount } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { banAccount, resolveReport, resolveRiskFlag, reviewListing, reviewPhoto } from "./actions";

export const metadata = { title: "Moderation · shroom" };
// Per-user page: never prerender.
export const dynamic = "force-dynamic";

const reasonLabel: Record<string, string> = {
  underage: "Under 18",
  coercion_or_trafficking: "Coercion or trafficking",
  not_the_person: "Not the person in the photos",
  scam: "Scam",
  harassment: "Harassment",
  spam: "Spam",
  other: "Other",
};

const flagLabel: Record<string, string> = {
  shared_phone: "Phone shared with another advertiser",
  shared_device: "Device shared with another advertiser",
  shared_payment_card: "Card shared with another advertiser",
  repeated_id_failures: "Repeated failed ID checks",
  safety_checkin: "Safety check-in answer",
  profile_wording: "Profile wording suggests a third party",
};

const answerLabel: Record<string, string> = {
  no: "no",
  yes: "yes",
  prefer_not_to_say: "rather not say",
  not_sure: "not sure",
};

function Queue({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[13px] uppercase tracking-[0.12em] text-fg-subtle">
        {title} · {count}
      </h2>
      {count === 0 ? <p className="text-[14px] text-fg-muted">Nothing waiting.</p> : <div className="space-y-3">{children}</div>}
    </section>
  );
}

function Decide({ action, id, approve, reject, withNote }: { action: (f: FormData) => Promise<void>; id: string | number; approve: [string, string]; reject: [string, string]; withNote?: boolean }) {
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="id" value={id} />
      {withNote && (
        <input name="note" placeholder="Note (optional)" className="w-full rounded-xl bg-surface-2 px-3 py-2 text-[14px] outline-none" />
      )}
      <div className="flex gap-2">
        <button name="decision" value={approve[0]} className="flex-1 rounded-full bg-accent py-2.5 text-[14px] font-medium text-accent-fg">
          {approve[1]}
        </button>
        <button name="decision" value={reject[0]} className="flex-1 rounded-full bg-surface-2 py-2.5 text-[14px]">
          {reject[1]}
        </button>
      </div>
    </form>
  );
}

export default async function ModerationPage() {
  const account = await requireAccount("/moderation");
  if (account.role !== "moderator" && account.role !== "admin") notFound();
  const supabase = await createClient();

  const [{ data: reports }, { data: photos }, { data: listings }] = await Promise.all([
    supabase
      .from("reports")
      .select("*, listings(slug, display_name), messages(body)")
      .eq("status", "open")
      .order("urgent", { ascending: false })
      .order("created_at")
      .limit(50),
    supabase.from("listing_photos").select("*, listings(slug, display_name)").eq("status", "pending").order("created_at").limit(60),
    supabase
      .from("listings")
      .select("*, accounts!listings_advertiser_id_fkey(id_verification)")
      .or("status.eq.pending_review,needs_review.eq.true")
      .order("updated_at")
      .limit(50),
  ]);

  // Onboarding facts for the advertisers in the queues: open flags, the
  // safety check-in, and whether they agreed to the current statements.
  const { data: flags } = await supabase
    .from("risk_flags")
    .select("*")
    .eq("status", "open")
    .order("severity", { ascending: false })
    .order("created_at")
    .limit(100);
  const advertiserIds = [...new Set([...(listings ?? []).map((l) => l.advertiser_id), ...(flags ?? []).map((f) => f.account_id)])];
  const [{ data: flagListings }, { data: checkins }, { data: statements }, { data: consents }] = advertiserIds.length
    ? await Promise.all([
        supabase.from("listings").select("advertiser_id, display_name, slug").in("advertiser_id", advertiserIds),
        supabase.from("safety_checkins").select("*").in("account_id", advertiserIds).order("created_at", { ascending: false }),
        supabase.from("consent_statements").select("key, version"),
        supabase.from("consents").select("account_id, statement_key, statement_version").in("account_id", advertiserIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const nameOf = new Map((flagListings ?? []).map((l) => [l.advertiser_id, `${l.display_name} (/${l.slug})`]));
  const checkinOf = new Map<string, NonNullable<typeof checkins>[number]>();
  for (const c of checkins ?? []) if (!checkinOf.has(c.account_id)) checkinOf.set(c.account_id, c);
  const version = Math.max(0, ...(statements ?? []).map((s) => s.version));
  const needed = (statements ?? []).filter((s) => s.version === version).length;
  const consentsDone = (id: string) =>
    needed > 0 && (consents ?? []).filter((c) => c.account_id === id && c.statement_version === version).length === needed;
  const openFlags = (id: string) => (flags ?? []).filter((f) => f.account_id === id).length;

  const { data: signed } = photos?.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  return (
    <main className="px-5 pt-8 pb-32">
      <h1 className="text-[40px] font-medium tracking-[-0.04em]">Moderation</h1>

      <Queue title="Reports" count={reports?.length ?? 0}>
        {reports?.map((r) => (
          <article key={r.id} className={cn("rounded-3xl bg-surface p-4", r.urgent && "ring-2 ring-like")}>
            <div className="flex items-center justify-between text-[13px] text-fg-muted">
              <span className={cn(r.urgent && "font-medium text-like")}>{reasonLabel[r.reason]}</span>
              <span>{formatRelative(r.created_at)}</span>
            </div>
            <p className="mt-2 text-[15px]">
              {r.message_id ? `Message: “${r.messages?.body ?? "deleted"}”` : r.listings ? `Profile: ${r.listings.display_name} (/${r.listings.slug})` : "Account"}
            </p>
            {r.details && <p className="mt-1 text-[14px] text-fg-muted">{r.details}</p>}
            <Decide action={resolveReport} id={r.id} approve={["actioned", "Actioned"]} reject={["dismissed", "Dismiss"]} withNote />
            {r.reported_account_id && (
              <form action={banAccount} className="mt-2">
                <input type="hidden" name="id" value={r.reported_account_id} />
                <input type="hidden" name="note" value={`Report #${r.id}: ${reasonLabel[r.reason]}`} />
                <button className="w-full rounded-full py-2 text-[13px] text-like ring-1 ring-like/40">Ban this account</button>
              </form>
            )}
          </article>
        ))}
      </Queue>

      <Queue title="Risk flags" count={flags?.length ?? 0}>
        {flags?.map((f) => (
          <article key={f.id} className={cn("rounded-3xl bg-surface p-4", f.severity === "urgent" && "ring-2 ring-like")}>
            <div className="flex items-center justify-between text-[13px] text-fg-muted">
              <span className={cn(f.severity === "urgent" && "font-medium text-like")}>{flagLabel[f.kind]}</span>
              <span>{formatRelative(f.created_at)}</span>
            </div>
            <p className="mt-2 text-[15px]">{nameOf.get(f.account_id) ?? "Advertiser with no profile yet"}</p>
            <p className="mt-1 text-[14px] text-fg-muted">{f.detail}</p>
            {f.related_account_id && (
              <p className="mt-1 text-[14px] text-fg-muted">Shared with: {nameOf.get(f.related_account_id) ?? "an account with no profile yet"}</p>
            )}
            <Decide action={resolveRiskFlag} id={f.id} approve={["actioned", "Actioned"]} reject={["cleared", "Clear"]} withNote />
          </article>
        ))}
      </Queue>

      <Queue title="Photos" count={photos?.length ?? 0}>
        <div className="grid grid-cols-2 gap-2">
          {photos?.map((p) => (
            <article key={p.id} className="rounded-3xl bg-surface p-2">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
                {urls.get(p.storage_path) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urls.get(p.storage_path)!} alt="" className="h-full w-full object-cover" />
                )}
                {p.is_locked && <span className="glass absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px]">Locked</span>}
              </div>
              <p className="mt-2 truncate px-1 text-[13px] text-fg-muted">{p.listings?.display_name}</p>
              <Decide action={reviewPhoto} id={p.id} approve={["approve", "Approve"]} reject={["reject", "Reject"]} />
            </article>
          ))}
        </div>
      </Queue>

      <Queue title="Profiles" count={listings?.length ?? 0}>
        {listings?.map((l) => (
          <article key={l.id} className="rounded-3xl bg-surface p-4">
            <div className="flex items-center justify-between">
              <p className="text-[17px]">
                {l.display_name}, {l.age}
              </p>
              <span className="text-[13px] text-fg-muted">{l.needs_review ? "Edited while live" : "New"}</span>
            </div>
            <p className="text-[14px] text-fg-muted">
              {l.area} · ID {l.accounts?.id_verification ?? "none"} · {l.approved_photo_count} approved photos
            </p>
            <p className="text-[14px] text-fg-muted">
              Statements {consentsDone(l.advertiser_id) ? "agreed" : "not agreed"} ·{" "}
              {checkinOf.get(l.advertiser_id)
                ? `check-in: others involved ${answerLabel[checkinOf.get(l.advertiser_id)!.others_involved]}, free to stop ${answerLabel[checkinOf.get(l.advertiser_id)!.free_to_stop]}`
                : "no check-in"}
              {openFlags(l.advertiser_id) > 0 && <span className="text-like"> · {openFlags(l.advertiser_id)} open flags</span>}
            </p>
            {l.bio && <p className="mt-2 text-[14px]">{l.bio}</p>}
            <Decide action={reviewListing} id={l.id} approve={["approve", "Approve"]} reject={["reject", l.status === "published" ? "Suspend" : "Reject"]} withNote />
          </article>
        ))}
      </Queue>
    </main>
  );
}
