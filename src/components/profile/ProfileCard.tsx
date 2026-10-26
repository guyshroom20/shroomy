import { Bookmark, ChevronDown, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/cn";

type Props = { profile: Profile; className?: string; interactive?: boolean };

/** The large photo card used in the For You stack. */
export function ProfileCard({ profile, className, interactive = true }: Props) {
  return (
    <article className={cn("relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2", className)}>
      <PhotoFill photo={profile.photos[0]} priority />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {interactive && (
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <IconButton label="More options" variant="glass" size="sm">
            <EllipsisVertical className="size-5" />
          </IconButton>
          <IconButton label="Bookmark" variant="glass" size="sm">
            <Bookmark className="size-4" />
          </IconButton>
        </div>
      )}

      <div className="absolute inset-x-4 bottom-4">
        <h2 className="flex items-center gap-2 text-[32px] font-semibold leading-none tracking-[-0.03em]">
          {profile.displayName}, {profile.age}
          {profile.verified && <VerifiedBadge className="size-7" />}
        </h2>
        <div className="mt-3 flex items-center justify-between">
          <StatusPill status={profile.availability} />
          {interactive && (
            <Link
              href={`/profile/${profile.id}`}
              aria-label={`View ${profile.displayName}'s profile`}
              className="glass flex size-10 items-center justify-center rounded-full"
            >
              <ChevronDown className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
