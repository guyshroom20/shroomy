"use client";

import { Pencil, Share2, Store } from "lucide-react";
import Link from "next/link";
import { ProfileView } from "@/components/profile/ProfileView";
import { useMyListing } from "@/lib/my-listing";
import { useToast } from "@/lib/toast";

const statusCopy = {
  draft: "Draft. Only you can see it.",
  pending_review: "Waiting for a moderator.",
  published: "Live.",
  rejected: "Changes needed before it can go live.",
  suspended: "Suspended.",
} as const;

export default function MyListingPage() {
  const { profile, listing, remote, loaded } = useMyListing();
  const toast = useToast();
  if (!loaded) return null;

  if (!profile || !listing) {
    return (
      <main className="flex flex-1 flex-col px-5 pt-8 pb-safe">
        <Link href="/" className="text-[15px] font-medium tracking-[-0.02em] text-fg-muted">
          shroom
        </Link>
        <h1 className="mt-8 text-[40px] font-medium leading-[1.05] tracking-[-0.04em]">My listing</h1>
        <div className="mt-8 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-2">
            <Store className="size-7 text-accent" />
          </span>
          <p className="mt-4 text-[17px]">You don&apos;t have a listing yet</p>
          <p className="mt-1 text-[14px] text-fg-muted">Add your details and photos. You can preview it before anyone sees it.</p>
          <Link href="/me/edit" className="mt-6 rounded-full bg-accent px-5 py-3 text-[15px] font-medium text-accent-fg">
            Create your listing
          </Link>
        </div>
      </main>
    );
  }

  const share = async () => {
    const url = `${window.location.origin}/profile/${remote ? listing.slug : "me"}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Listing link copied");
    } catch {
      toast("Couldn't copy the link");
    }
  };

  return (
    <ProfileView
      profile={profile}
      banner={
        remote ? (
          <p className="rounded-2xl bg-surface px-4 py-3 text-[13px] leading-snug text-fg-muted">
            <span className="text-fg">{statusCopy[remote.status]}</span>{" "}
            {remote.needsReview && "Your latest edits are being checked. "}
            {(remote.status === "draft" || remote.status === "rejected") && (
              <Link href="/advertise" className="text-fg underline underline-offset-4">
                Verify your ID and send it for review
              </Link>
            )}
          </p>
        ) : (
          <p className="rounded-2xl bg-surface px-4 py-3 text-[13px] leading-snug text-fg-muted">
            <span className="text-fg">Preview.</span> This is how visitors see your listing. Saved on this device until you
            sign in as an advertiser; then every edit is checked by a moderator.
          </p>
        )
      }
      actions={
        <>
          <Link
            href="/me/edit"
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-medium text-accent-fg"
          >
            <Pencil className="size-5" /> Edit listing
          </Link>
          <button
            type="button"
            onClick={share}
            aria-label="Copy listing link"
            className="flex size-14 items-center justify-center rounded-full bg-surface-2 text-fg"
          >
            <Share2 className="size-5" />
          </button>
        </>
      }
    />
  );
}
