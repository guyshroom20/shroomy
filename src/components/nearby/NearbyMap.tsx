"use client";

import { LocateFixed } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import { useFilteredProfiles } from "@/lib/filters";
import { useWithMyListing } from "@/lib/my-listing";
import { useToast } from "@/lib/toast";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/cn";
import { MapBackdrop } from "./MapBackdrop";

/**
 * Map of nearby profiles. Positions are approximate (area level, fuzzed
 * server side) so an advertiser's real location is never exposed.
 */
export function NearbyMap({ profiles: all }: { profiles: Profile[] }) {
  const profiles = useFilteredProfiles(useWithMyListing(all));
  const [pickedId, setPickedId] = useState<string>();
  const toast = useToast();
  // Fall back to the first visible pin when the picked one is filtered out.
  const selectedId = profiles.some((p) => p.id === pickedId) ? pickedId : profiles[0]?.id;

  const recentre = () => {
    const nearest = [...profiles].sort((a, b) => a.distanceMiles - b.distanceMiles)[0];
    if (!nearest) return toast("No one nearby matches your filters");
    setPickedId(nearest.id);
    toast(`Nearest: ${nearest.displayName}, ${nearest.distanceMiles} mi`);
  };

  return (
    <div className="absolute inset-0">
      <MapBackdrop />
      {profiles.map((p) => {
        const selected = p.id === selectedId;
        return (
          <div
            key={p.id}
            className={cn("absolute -translate-x-1/2", selected ? "z-10 -translate-y-[40%]" : "-translate-y-1/2")}
            style={{ left: `${p.mapPosition.x * 100}%`, top: `${p.mapPosition.y * 100}%` }}
          >
            {selected ? (
              <Link href={`/profile/${p.id}`} className="flex flex-col items-center" aria-label={`View ${p.displayName}`}>
                <span className="relative block size-48 overflow-hidden rounded-full border-4 border-accent shadow-2xl">
                  <PhotoFill photo={p.photos[0]} />
                </span>
                <span className="-mt-1 h-0 w-0 border-x-[14px] border-t-[40px] border-x-transparent border-t-accent" />
                <span className="glass mt-2 flex flex-col items-start gap-2 rounded-2xl p-3">
                  <span className="flex items-center gap-1.5 text-[15px]">
                    {p.displayName}, {p.age}
                    {p.verified && <VerifiedBadge className="size-4" />}
                  </span>
                  <StatusPill status={p.availability} className="bg-surface-3/60 text-[12px]" />
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setPickedId(p.id)}
                aria-label={`${p.displayName}, ${p.distanceMiles} miles away`}
                className="relative block size-20 overflow-hidden rounded-full border-4 border-surface-3 shadow-xl transition active:scale-95"
              >
                <PhotoFill photo={p.photos[0]} />
              </button>
            )}
          </div>
        );
      })}

      <button type="button" aria-label="Recentre map" onClick={recentre} className="glass absolute bottom-28 right-4 z-20 flex size-14 items-center justify-center rounded-full">
        <LocateFixed className="size-6" />
      </button>
    </div>
  );
}
