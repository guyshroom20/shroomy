import { ChevronLeft, ChevronUp, MapPin } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { GalleryProvider, GalleryTrigger } from "./Gallery";
import { InfoSection } from "./InfoSection";
import { PhotoStrip } from "./PhotoStrip";
import { TagList } from "./TagList";

type Props = {
  profile: Profile;
  /** Buttons in the sticky bar at the bottom (Message/Save for visitors, Edit for the owner). */
  actions: React.ReactNode;
  /** Optional note above the photos, e.g. "This is how visitors see your listing". */
  banner?: React.ReactNode;
  backHref?: string;
};

/** A full profile as visitors see it. Shared by /profile/[id] and the advertiser's own /me. */
export function ProfileView({ profile, actions, banner, backHref = "/" }: Props) {
  return (
    <GalleryProvider photos={profile.photos}>
      <main className="flex flex-col gap-2 px-2 pb-32 pt-2">
        {banner}
        <section className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
          <PhotoFill photo={profile.photos[0]} priority />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
          <GalleryTrigger index={0} label={`Open ${profile.displayName}'s photos`} />
          <div className="absolute inset-x-3 top-3 flex justify-between">
            <Link href={backHref} aria-label="Back" className="glass flex size-10 items-center justify-center rounded-full">
              <ChevronLeft className="size-5" />
            </Link>
            {profile.story && (
              <Link href={`/stories/${profile.story.id}`} className="glass rounded-full px-4 py-2 text-[13px]">
                View story
              </Link>
            )}
          </div>
          <div className="absolute inset-x-5 bottom-5">
            <h1 className="flex items-center gap-2 text-[34px] font-semibold leading-none tracking-[-0.03em]">
              {profile.displayName}, {profile.age}
              {profile.verified && <VerifiedBadge className="size-7" />}
            </h1>
            <p className="mt-2 flex items-center gap-1 text-[14px] text-fg/80">
              <MapPin className="size-3.5" /> {profile.area} · {profile.distanceMiles} mi
            </p>
            <div className="mt-3 flex items-center justify-between">
              <StatusPill status={profile.availability} />
              <Link href={backHref} aria-label="Close profile" className="glass flex size-10 items-center justify-center rounded-full">
                <ChevronUp className="size-5" />
              </Link>
            </div>
          </div>
        </section>

        {(profile.photos.length > 1 || profile.lockedCount > 0) && (
          <PhotoStrip photos={profile.photos} lockedCount={profile.lockedCount} name={profile.displayName} />
        )}

        {profile.bio && (
          <InfoSection title="About me" collapsible>
            {profile.bio}
          </InfoSection>
        )}

        {profile.tags.length > 0 && (
          <InfoSection title="More info">
            <TagList tags={profile.tags} />
          </InfoSection>
        )}

        <div className="glass fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[440px] gap-2 px-4 pt-3 pb-safe">{actions}</div>
      </main>
    </GalleryProvider>
  );
}
