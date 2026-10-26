import { BadgeCheck, Check, Clock, LifeBuoy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ListingForm } from "@/components/advertise/ListingForm";
import { PhotoManager } from "@/components/advertise/PhotoManager";
import { CheckinForm, ConsentForm, PhoneForm, SendForReviewButton } from "@/components/onboarding/StepForms";
import { requireAccount } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { PHOTO_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Start advertising · shroom" };
// Per-user page: never prerender.
export const dynamic = "force-dynamic";

/** Whole years since a YYYY-MM-DD date of birth, matching the database's age(). */
function ageFrom(birthDate: string) {
  const [y, m, d] = birthDate.split("-").map(Number);
  const now = new Date();
  const age = now.getUTCFullYear() - y;
  const hadBirthday = now.getUTCMonth() + 1 > m || (now.getUTCMonth() + 1 === m && now.getUTCDate() >= d);
  return hadBirthday ? age : age - 1;
}

function Step({ n, title, done, locked, children }: { n: number; title: string; done: boolean; locked?: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 flex items-center gap-2 text-[13px] uppercase tracking-[0.12em] text-fg-subtle">
        <span className={cn("grid size-6 place-items-center rounded-full text-[12px]", done ? "bg-verified text-bg" : "bg-surface-2")}>
          {done ? <Check className="size-3.5" /> : n}
        </span>
        {title}
      </h2>
      {locked && !done ? <p className="rounded-3xl bg-surface p-4 text-[15px] text-fg-muted">{locked}</p> : children}
    </section>
  );
}

function Done({ children }: { children: ReactNode }) {
  return <p className="rounded-3xl bg-surface p-4 text-[15px] text-fg-muted">{children}</p>;
}

// Advertiser onboarding: a fixed sequence of steps. Each step's outcome is
// recorded, and a moderator makes the only decision that puts a profile live.
export default async function OnboardingPage() {
  const account = await requireAccount("/onboarding");
  if (account.role !== "advertiser") {
    return (
      <main className="px-5 pt-10">
        <h1 className="text-[34px] font-medium tracking-[-0.04em]">Advertise on shroom</h1>
        <p className="mt-3 text-fg-muted">This is a visitor account. Advertising needs its own account so we can verify your ID.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const [{ data: progressRows }, { data: statements }, { data: listing }] = await Promise.all([
    supabase.rpc("my_onboarding"),
    supabase.from("consent_statements").select("key, version, position, wording").order("version", { ascending: false }).order("position"),
    supabase.from("listings").select("*").eq("advertiser_id", account.id).maybeSingle(),
  ]);
  const progress = progressRows?.[0];
  const current = (statements ?? []).filter((s) => s.version === progress?.consent_version);
  const { data: photoRows } = listing
    ? await supabase.from("listing_photos").select("*").eq("listing_id", listing.id).order("position")
    : { data: [] };
  const photos = photoRows ?? [];
  const { data: signed } = photos.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(photos.map((p) => p.storage_path), 3600)
    : { data: [] };
  const urls = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const consented = Boolean(progress?.consents_done);
  const verified = account.id_verification === "passed";
  const phoneDone = Boolean(progress?.phone_done);
  const profileDone = Boolean(listing);
  const photosDone = photos.length > 0;
  const checkinDone = Boolean(progress?.checkin_done);
  const submitted = listing && listing.status !== "draft" && listing.status !== "rejected";
  const ready = consented && phoneDone && profileDone && photosDone && checkinDone;

  return (
    <main className="px-5 pt-8 pb-32">
      <h1 className="text-[40px] font-medium tracking-[-0.04em]">Start advertising</h1>
      <p className="mt-2 text-[15px] text-fg-muted">
        One verified person per profile. It takes about ten minutes, and you can stop and come back at any point.
      </p>

      <aside className="mt-6 flex gap-3 rounded-3xl bg-surface p-4 text-[14px] leading-snug">
        <LifeBuoy className="size-5 shrink-0 text-verified" />
        <p>
          If anyone is forcing or controlling you, call the Modern Slavery &amp; Exploitation Helpline on{" "}
          <a href="tel:08000121700" className="underline">08000 121 700</a> (free, confidential, 24/7), or 999 in an emergency.
          You can pause or delete your profile at any time.
        </p>
      </aside>

      <Step n={1} title="The rules" done={consented}>
        {consented ? <Done>You&apos;ve agreed to the advertiser statements.</Done> : <ConsentForm statements={current} />}
      </Step>

      <Step n={2} title="Verify your ID" done={verified} locked={consented ? undefined : "Agree to the rules first."}>
        <div className="flex items-center gap-3 rounded-3xl bg-surface p-4">
          {verified ? <BadgeCheck className="size-6 text-verified" /> : <Clock className="size-6 text-fg-muted" />}
          <p className="flex-1 text-[15px]">
            {verified
              ? "ID verified."
              : account.id_verification === "pending"
                ? "Check in progress. This page updates when it's done."
                : account.id_verification === "failed"
                  ? "That check didn't pass. You can try again."
                  : "You'll photograph your ID and take a short video selfie. Our partner Yoti checks they match. We never see or keep your documents."}
          </p>
        </div>
        {!verified && (
          <form action="/api/verification/start" method="post" className="mt-3">
            <input type="hidden" name="kind" value="id_verification" />
            <input type="hidden" name="return" value="/onboarding" />
            <button className="w-full rounded-full bg-fg py-3.5 text-[15px] font-medium text-bg">
              {account.id_verification === "none" ? "Verify my ID" : "Start the check again"}
            </button>
          </form>
        )}
      </Step>

      <Step n={3} title="Your phone number" done={phoneDone} locked={verified ? undefined : "Verify your ID first."}>
        {phoneDone ? (
          <Done>Saved. We keep a scrambled code, not the number itself.</Done>
        ) : (
          <>
            <p className="mb-3 text-[15px] text-fg-muted">
              The number you use for bookings. We don&apos;t show it or keep it: we store a scrambled code to make sure each
              number belongs to one person.
            </p>
            <PhoneForm />
          </>
        )}
      </Step>

      <Step n={4} title="Your profile" done={profileDone} locked={verified ? undefined : "Verify your ID first."}>
        <ListingForm listing={listing} verifiedAge={account.birth_date ? ageFrom(account.birth_date) : undefined} />
      </Step>

      <Step n={5} title="Photos" done={photosDone} locked={profileDone ? undefined : "Create your profile first."}>
        <p className="mb-3 text-[15px] text-fg-muted">Only photos of you, with nobody else in them. A moderator checks each one.</p>
        {listing && (
          <PhotoManager listingId={listing.id} photos={photos.map((p) => ({ ...p, url: urls.get(p.storage_path) ?? undefined }))} />
        )}
      </Step>

      <Step n={6} title="Safety check-in" done={checkinDone} locked={verified ? undefined : "Verify your ID first."}>
        {checkinDone ? (
          <Done>Thanks. Your answers go only to our safety team.</Done>
        ) : (
          <>
            <p className="mb-4 text-[15px] text-fg-muted">
              We ask everyone. Your answers aren&apos;t shown on your profile, and answering honestly won&apos;t end your
              application on its own.
            </p>
            <CheckinForm />
          </>
        )}
      </Step>

      <Step n={7} title="Send for review" done={Boolean(submitted)}>
        {submitted ? (
          <Done>
            Your profile is with a moderator.{" "}
            <Link href="/advertise" className="underline">
              See its status
            </Link>
            .
          </Done>
        ) : (
          <>
            <SendForReviewButton ready={ready} />
            {!ready && <p className="mt-2 text-[13px] text-fg-subtle">Finish the steps above first.</p>}
          </>
        )}
      </Step>
    </main>
  );
}
