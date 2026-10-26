import { BadgeCheck, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListingForm } from "@/components/advertise/ListingForm";
import { PhotoManager } from "@/components/advertise/PhotoManager";
import { requireAccount } from "@/lib/auth";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { submitForReview } from "./actions";

export const metadata = { title: "Your profile · shroom" };
// Per-user page: never prerender.
export const dynamic = "force-dynamic";

const statusCopy = {
  draft: "Draft. Only you can see it.",
  pending_review: "Waiting for a moderator.",
  published: "Live.",
  rejected: "Changes needed before it can go live.",
  suspended: "Suspended. Contact support.",
} as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-[13px] uppercase tracking-[0.12em] text-fg-subtle">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdvertisePage() {
  const account = await requireAccount("/advertise");
  if (account.role !== "advertiser") {
    return (
      <main className="px-5 pt-10">
        <h1 className="text-[34px] font-medium tracking-[-0.04em]">Advertise on shroom</h1>
        <p className="mt-3 text-fg-muted">This is a visitor account. Advertising needs its own account so we can verify your ID.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("*").eq("advertiser_id", account.id).maybeSingle();
  const { data: photoRows } = listing
    ? await supabase.from("listing_photos").select("*").eq("listing_id", listing.id).order("position")
    : { data: [] };
  const photos = photoRows ?? [];
  const { data: signed } = photos.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 3600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const verified = account.id_verification === "passed";
  const { data: progress } = await supabase.rpc("my_onboarding");
  const onboarded = Boolean(progress?.[0]?.consents_done && progress[0].phone_done && progress[0].checkin_done);

  return (
    <main className="px-5 pt-8 pb-32">
      <h1 className="text-[40px] font-medium tracking-[-0.04em]">Your profile</h1>
      {listing && (
        <p className="mt-2 text-[15px] text-fg-muted">
          {statusCopy[listing.status]}
          {listing.needs_review && " Your latest edits are being checked."}
          {listing.moderation_note && ` Note from moderators: ${listing.moderation_note}`}
        </p>
      )}

      {!onboarded && (
        <Link href="/onboarding" className="mt-6 flex items-center gap-3 rounded-3xl bg-accent p-4 text-accent-fg">
          <span className="flex-1 text-[15px] font-medium">Finish setting up: rules, ID, safety check-in</span>
          <ChevronRight className="size-5" />
        </Link>
      )}

      <Section title="1. Verify your ID">
        <div className="flex items-center gap-3 rounded-3xl bg-surface p-4">
          {verified ? <BadgeCheck className="size-6 text-verified" /> : <Clock className="size-6 text-fg-muted" />}
          <div className="flex-1 text-[15px]">
            {verified
              ? "ID verified"
              : account.id_verification === "pending"
                ? "Check in progress"
                : account.id_verification === "failed"
                  ? "That check didn't pass. You can try again."
                  : "One person per profile. We check your ID and a selfie through a verification partner. We never see or store your documents."}
          </div>
        </div>
        {!verified && (
          <form action="/api/verification/start" method="post" className="mt-3">
            <input type="hidden" name="kind" value="id_verification" />
            <input type="hidden" name="return" value="/advertise" />
            <button className="w-full rounded-full bg-fg py-3.5 text-[15px] font-medium text-bg">Verify my ID</button>
          </form>
        )}
      </Section>

      <Section title="2. Your details">
        <ListingForm listing={listing} />
      </Section>

      {listing && (
        <Section title="3. Photos">
          <PhotoManager listingId={listing.id} photos={photos.map((p) => ({ ...p, url: urls.get(p.storage_path) ?? undefined }))} />
        </Section>
      )}

      {listing && (listing.status === "draft" || listing.status === "rejected") && (
        <Section title="4. Go live">
          <form
            action={async () => {
              "use server";
              await submitForReview();
            }}
          >
            <button
              disabled={!photos.length}
              className="w-full rounded-full bg-accent py-4 text-[16px] font-medium text-accent-fg disabled:opacity-50"
            >
              Send for review
            </button>
          </form>
          {!verified && <p className="mt-2 text-[13px] text-fg-subtle">You can send it now. It goes live once your ID check passes.</p>}
        </Section>
      )}
    </main>
  );
}
