"use client";

import { Lock, LockOpen, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteListingPhoto, setPhotoLocked, uploadListingPhoto } from "@/lib/data/photos";
import type { Tables } from "@/lib/supabase/database.types";

type PhotoRow = Tables<"listing_photos"> & { url?: string };

const statusLabel = { pending: "In review", approved: "Live", rejected: "Rejected" } as const;

export function PhotoManager({ listingId, photos }: { listingId: string; photos: PhotoRow[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const run = async (task: () => Promise<unknown>) => {
    setBusy(true);
    setError(undefined);
    try {
      await task();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const onFiles = (files: FileList | null) =>
    files &&
    run(async () => {
      let position = photos.length;
      for (const file of Array.from(files).slice(0, 10)) {
        await uploadListingPhoto(listingId, file, { position: position++, locked: false });
      }
    });

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-surface-2">
            {p.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.url} alt="" className="h-full w-full object-cover" />
            )}
            <span className="glass absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[11px]">
              {statusLabel[p.status]}
            </span>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => setPhotoLocked(p.id, !p.is_locked))}
                aria-label={p.is_locked ? "Make public" : "Lock (18+ verified visitors only)"}
                className="glass flex size-8 items-center justify-center rounded-full"
              >
                {p.is_locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => deleteListingPhoto(p))}
                aria-label="Delete photo"
                className="glass flex size-8 items-center justify-center rounded-full"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex aspect-[3/4] flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-[13px] text-fg-muted"
        >
          <Plus className="size-6" />
          {busy ? "Uploading…" : "Add photos"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
      {error && <p className="mt-3 text-[14px] text-like">{error}</p>}
      <p className="mt-3 text-[13px] text-fg-subtle">
        Location data is removed from photos before upload. Locked photos are only shown to age-verified members. Every
        photo is checked by a moderator first.
      </p>
    </div>
  );
}
