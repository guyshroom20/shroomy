import { ChevronLeft, ChevronUp, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InfoSection } from "@/components/profile/InfoSection";
import { PhotoStrip } from "@/components/profile/PhotoStrip";
import { SaveButton } from "@/components/profile/SaveButton";
import { TagList } from "@/components/profile/TagList";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { conversations, getProfile, profiles } from "@/lib/mock-data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return profiles.map((p) => ({ id: p.id }));
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = getProfile(id);
  if (!profile) notFound();
  const convo = conversations.find((c) => c.profileId === profile.id);

  return (
    <main className="flex flex-col gap-2 px-2 pb-32 pt-2">
      <section className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-card)]">
        <PhotoFill photo={profile.photos[0]} priority />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <Link href="/" aria-label="Back" className="glass flex size-10 items-center justify-center rounded-full">
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
            <Link href="/" aria-label="Close profile" className="glass flex size-10 items-center justify-center rounded-full">
              <ChevronUp className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      <PhotoStrip photos={profile.photos} lockedCount={profile.lockedCount} />

      <InfoSection title="About me" collapsible>
        {profile.bio}
      </InfoSection>

      <InfoSection title="More info">
        <TagList tags={profile.tags} />
      </InfoSection>

      <div className="glass fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[440px] gap-2 px-4 pt-3 pb-safe">
        <Link
          href={convo ? `/messages/${convo.id}` : "/messages"}
          className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-fg text-[16px] font-medium text-bg"
        >
          <MessageCircle className="size-5" /> Message
        </Link>
        <SaveButton profileId={profile.id} />
      </div>
    </main>
  );
}
