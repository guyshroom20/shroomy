"use client";

import { ChevronLeft, ChevronRight, Lock, LockOpen, Plus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { cleanImageToDataUrl } from "@/lib/image";
import { LIMITS, sortPhotos, type ListingPhotoDraft } from "@/lib/my-listing";
import { cn } from "@/lib/cn";

type Props = { photos: ListingPhotoDraft[]; onChange: (photos: ListingPhotoDraft[]) => void; error?: string };

const renumber = (photos: ListingPhotoDraft[]) => photos.map((p, i) => ({ ...p, position: i }));

const control = "glass flex size-8 items-center justify-center rounded-full disabled:opacity-30";

/**
 * Add, remove, reorder and lock photos. Mirrors the backend's PhotoManager
 * (lock toggle, delete, add) and adds ordering, which maps to `position`.
 */
export function PhotoEditor({ photos, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [readError, setReadError] = useState<string>();
  const sorted = sortPhotos(photos);
  const room = LIMITS.photos - sorted.length;

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setReadError(undefined);
    try {
      const urls = await Promise.all(Array.from(files).slice(0, room).map((f) => cleanImageToDataUrl(f)));
      onChange(renumber([...sorted, ...urls.map((url) => ({ id: crypto.randomUUID(), url, position: 0, is_locked: false }))]));
      if (files.length > room) setReadError(`Only ${LIMITS.photos} photos allowed, so some weren't added.`);
    } catch {
      setReadError("Couldn't read one of those images. Try a JPEG, PNG or WebP.");
    } finally {
      setBusy(false);
    }
  };

  const move = (from: number, to: number) => {
    const next = [...sorted];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(renumber(next));
  };
  const patch = (id: string, change: Partial<ListingPhotoDraft>) => onChange(sorted.map((p) => (p.id === id ? { ...p, ...change } : p)));

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((p, i) => (
          <div key={p.id} className={cn("relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2", i === 0 && "ring-2 ring-accent")}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className={cn("h-full w-full object-cover", p.is_locked && "opacity-60")} />
            {i > 0 && !p.is_locked ? (
              <button
                type="button"
                onClick={() => move(i, 0)}
                aria-label={`Make photo ${i + 1} the cover`}
                className={cn(control, "absolute left-1.5 top-1.5")}
              >
                <Star className="size-4" />
              </button>
            ) : (
              <span className={cn("absolute left-1.5 top-1.5 rounded-full px-2 py-1 text-[11px]", i === 0 ? "bg-accent text-accent-fg" : "glass")}>
                {i === 0 ? "Cover" : "18+"}
              </span>
            )}
            <button
              type="button"
              onClick={() => onChange(renumber(sorted.filter((x) => x.id !== p.id)))}
              aria-label={`Delete photo ${i + 1}`}
              className={cn(control, "absolute right-1.5 top-1.5")}
            >
              <Trash2 className="size-4" />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move photo ${i + 1} earlier`} className={control}>
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => patch(p.id, { is_locked: !p.is_locked })}
                aria-label={p.is_locked ? `Make photo ${i + 1} public` : `Lock photo ${i + 1} (18+ verified visitors only)`}
                aria-pressed={p.is_locked}
                className={p.is_locked ? control.replace("glass", "bg-accent text-accent-fg") : control}
              >
                {p.is_locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              </button>
              <button type="button" disabled={i === sorted.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move photo ${i + 1} later`} className={control}>
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        ))}
        {room > 0 && (
          <button
            type="button"
            disabled={busy}
            onClick={() => input.current?.click()}
            className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-[13px] text-fg-muted"
          >
            <Plus className="size-6" />
            {busy ? "Adding…" : "Add photos"}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {(error || readError) && (
        <p role="alert" className="mt-3 text-[14px] text-like">
          {error ?? readError}
        </p>
      )}
      <p className="mt-3 text-[13px] text-fg-subtle">
        The first photo is your cover. Location data is removed from photos when you add them. Locked photos (🔒) are only
        shown to age-verified members. Once accounts go live, every photo is checked by a moderator first.
      </p>
    </div>
  );
}
