"use client";

import { Bookmark, ChevronDown, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { MY_LISTING_ID } from "@/lib/my-listing";
import { useSaved } from "@/lib/saved";
import { useToast } from "@/lib/toast";
import { IconButton } from "@/components/ui/IconButton";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/cn";
import { ProfileMenu } from "./ProfileMenu";

type Props = { profile: Profile; className?: string; interactive?: boolean; onHide?: () => void };

/** The large photo card used in the For You stack. */
export function ProfileCard({ profile, className, interactive = true, onHide }: Props) {
  const { isSaved, toggle } = useSaved();
  const toast = useToast();
  const saved = isSaved(profile.id);
  return (
    <article className={cn("relative h-full w-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2", className)}>
      <PhotoFill photo={profile.photos[0]} priority />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

      {interactive && (
        <div className="absolute inset-x-3 top-3 flex justify-between">
          <ProfileMenu profile={profile} onHide={onHide}>
            {(toggleMenu, open) => (
              <IconButton label="More options" variant="glass" size="sm" onClick={toggleMenu} aria-expanded={open}>
                <EllipsisVertical className="size-5" />
              </IconButton>
            )}
          </ProfileMenu>
          <IconButton
            label={saved ? "Remove bookmark" : "Bookmark"}
            variant="glass"
            size="sm"
            aria-pressed={saved}
            onClick={() => {
              toggle(profile.id);
              toast(saved ? `Removed ${profile.displayName} from saved` : `Saved ${profile.displayName}`);
            }}
          >
            <Bookmark className={cn("size-4", saved && "text-accent")} fill={saved ? "currentColor" : "none"} />
          </IconButton>
        </div>
      )}

      <div className="absolute inset-x-4 bottom-4">
        {profile.id === MY_LISTING_ID && (
          <span className="mb-2 inline-block rounded-full bg-accent px-2.5 py-1 text-[12px] font-medium text-accent-fg">Your listing</span>
        )}
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
