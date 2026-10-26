import { Lock } from "lucide-react";
import type { Photo } from "@/lib/types";
import { PhotoFill } from "@/components/ui/PhotoFill";

/** Row of thumbnails with an optional locked 18+ tile at the end. */
export function PhotoStrip({ photos, lockedCount }: { photos: Photo[]; lockedCount: number }) {
  const visible = photos.slice(1, lockedCount > 0 ? 4 : 5);
  return (
    <div className="grid grid-cols-4 gap-2">
      {visible.map((p) => (
        <div key={p.alt} className="relative aspect-square overflow-hidden rounded-2xl">
          <PhotoFill photo={p} />
        </div>
      ))}
      {lockedCount > 0 && (
        <button
          type="button"
          className="relative flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl text-center text-[13px] leading-tight"
          aria-label={`${lockedCount} locked 18+ photos`}
        >
          <PhotoFill photo={photos[photos.length - 1]} className="scale-110 blur-md" />
          <span className="absolute inset-0 bg-black/35" />
          <Lock className="relative size-5" />
          <span className="relative">
            18+
            <br />
            Content
          </span>
        </button>
      )}
    </div>
  );
}
