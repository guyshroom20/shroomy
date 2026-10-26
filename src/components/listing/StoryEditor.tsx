"use client";

import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { cleanImageToDataUrl } from "@/lib/image";
import { LIMITS, type StoryDraft } from "@/lib/my-listing";
import { Field } from "./fields";

type Props = { story: StoryDraft; onChange: (story: StoryDraft) => void; error?: string };

const control = "glass flex size-7 items-center justify-center rounded-full disabled:opacity-30";

/** Story caption, song and slides. Stories aren't in the backend schema yet, so this stays local. */
export function StoryEditor({ story, onChange, error }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const room = LIMITS.storySlides - story.slides.length;

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const urls = await Promise.all(Array.from(files).slice(0, room).map((f) => cleanImageToDataUrl(f, 1080)));
      onChange({ ...story, slides: [...story.slides, ...urls.map((url) => ({ id: crypto.randomUUID(), url }))] });
    } finally {
      setBusy(false);
    }
  };

  const move = (from: number, to: number) => {
    const slides = [...story.slides];
    const [s] = slides.splice(from, 1);
    slides.splice(to, 0, s);
    onChange({ ...story, slides });
  };

  return (
    <div className="space-y-4">
      <Field
        label="Caption"
        value={story.caption}
        onChange={(e) => onChange({ ...story, caption: e.target.value })}
        maxLength={LIMITS.storyCaption}
        counter={`${story.caption.length}/${LIMITS.storyCaption}`}
        placeholder="Golden hour, every hour"
        error={error}
      />
      <Field
        label="Now playing (optional)"
        value={story.now_playing}
        onChange={(e) => onChange({ ...story, now_playing: e.target.value })}
        maxLength={80}
        placeholder="Artist – Song"
      />
      <div>
        <span className="text-[13px] text-fg-muted">
          Slides ({story.slides.length}/{LIMITS.storySlides})
        </span>
        <div className="no-scrollbar mt-1.5 flex gap-2 overflow-x-auto">
          {story.slides.map((s, i) => (
            <div key={s.id} className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt={`Story slide ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label={`Delete slide ${i + 1}`}
                onClick={() => onChange({ ...story, slides: story.slides.filter((x) => x.id !== s.id) })}
                className={`${control} absolute right-1 top-1`}
              >
                <Trash2 className="size-3.5" />
              </button>
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move slide ${i + 1} earlier`} className={control}>
                  <ChevronLeft className="size-3.5" />
                </button>
                <button type="button" disabled={i === story.slides.length - 1} onClick={() => move(i, i + 1)} aria-label={`Move slide ${i + 1} later`} className={control}>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {room > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="flex aspect-[9/16] w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-line text-[12px] text-fg-muted"
            >
              <Plus className="size-5" />
              {busy ? "Adding…" : "Add slide"}
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
        <p className="mt-2 text-[13px] text-fg-subtle">Your story shows on your listing once it has at least one slide.</p>
      </div>
    </div>
  );
}
