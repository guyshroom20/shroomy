"use client";

import { Check, Lock } from "lucide-react";
import { useState } from "react";
import type { Photo } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { Sheet } from "@/components/ui/Sheet";
import { GalleryTrigger } from "./Gallery";

type Props = { photos: Photo[]; lockedCount: number; name: string };

/** Row of thumbnails with an optional locked 18+ tile at the end. Thumbnails open the gallery. */
export function PhotoStrip({ photos, lockedCount, name }: Props) {
  const [locked, setLocked] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [requested, setRequested] = useState(false);
  const toast = useToast();
  const end = lockedCount > 0 ? 4 : 5;
  const visible = photos.slice(1, end);

  return (
    <div className="grid grid-cols-4 gap-2">
      {visible.map((p, i) => (
        <div key={p.alt} className="relative aspect-square overflow-hidden rounded-2xl">
          <PhotoFill photo={p} />
          <GalleryTrigger index={i + 1} label={`Open ${p.alt}`} />
          {i === visible.length - 1 && photos.length > end && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 text-[17px] font-medium">
              +{photos.length - end}
            </span>
          )}
        </div>
      ))}
      {lockedCount > 0 && (
        <button
          type="button"
          onClick={() => setLocked(true)}
          className="relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-center text-[13px] leading-tight"
          aria-label={`${lockedCount} locked 18+ photos`}
        >
          <PhotoFill photo={photos[photos.length - 1]} className="scale-110 blur-md" />
          <span className="absolute inset-0 bg-black/35" />
          {requested ? <Check className="relative size-5" /> : <Lock className="relative size-5" />}
          <span className="relative">
            {requested ? "Requested" : <>18+<br />Content</>}
          </span>
        </button>
      )}

      <Sheet open={locked} onClose={() => setLocked(false)} title="18+ content">
        <p className="text-[15px] leading-relaxed text-fg-muted">
          {name} has {lockedCount} private {lockedCount === 1 ? "photo" : "photos"}. Request access and {name} decides who can see them.
        </p>
        <label className="mt-5 flex items-center gap-3 rounded-2xl bg-surface-2 p-4 text-[15px]">
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 accent-[var(--accent)]" />
          I confirm I&apos;m 18 or over
        </label>
        <button
          type="button"
          disabled={!confirmed || requested}
          onClick={() => {
            setRequested(true);
            setLocked(false);
            toast(`Request sent to ${name}`);
          }}
          className="mt-5 h-14 w-full rounded-full bg-fg text-[16px] font-medium text-bg transition disabled:opacity-40"
        >
          {requested ? "Request sent" : "Request access"}
        </button>
      </Sheet>
    </div>
  );
}
