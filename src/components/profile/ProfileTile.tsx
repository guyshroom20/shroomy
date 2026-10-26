"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import type { Profile } from "@/lib/types";
import { useSaved } from "@/lib/saved";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { cn } from "@/lib/cn";

/** Grid tile used in Explore and Saved. */
export function ProfileTile({ profile }: { profile: Profile }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(profile.id);
  return (
    <div className="relative aspect-[3/5] overflow-hidden rounded-3xl bg-surface-2">
      <Link href={`/profile/${profile.id}`} className="absolute inset-0" aria-label={`View ${profile.displayName}`}>
        <PhotoFill photo={profile.photos[0]} />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/35 to-transparent" />
        <h3 className="absolute inset-x-4 top-4 text-[26px] font-semibold leading-[1.05] tracking-[-0.03em]">
          {profile.displayName}
          <span className="mt-1 block text-[13px] font-normal tracking-normal text-fg/80">{profile.area.split(",")[0]}</span>
        </h3>
      </Link>
      <button
        type="button"
        onClick={() => toggle(profile.id)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${profile.displayName} from saved` : `Save ${profile.displayName}`}
        className="glass absolute bottom-4 left-1/2 flex size-16 -translate-x-1/2 items-center justify-center rounded-full transition active:scale-95"
      >
        <Heart className={cn("size-7", saved ? "text-like" : "text-white")} fill="currentColor" />
      </button>
    </div>
  );
}
