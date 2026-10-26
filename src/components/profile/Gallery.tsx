"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Photo } from "@/lib/types";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { cn } from "@/lib/cn";

const SWIPE_THRESHOLD = 60;

const Ctx = createContext<((index: number) => void) | null>(null);

/** Holds a profile's photos and renders the full-screen viewer when opened. */
export function GalleryProvider({ photos, children }: { photos: Photo[]; children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <Ctx.Provider value={setIndex}>
      {children}
      {index !== null && <Lightbox photos={photos} index={index} onChange={setIndex} onClose={() => setIndex(null)} />}
    </Ctx.Provider>
  );
}

export function useGallery() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGallery must be used inside GalleryProvider");
  return ctx;
}

/** Invisible button covering its parent that opens the gallery at `index`. */
export function GalleryTrigger({ index, label, className }: { index: number; label: string; className?: string }) {
  const open = useGallery();
  return <button type="button" aria-label={label} onClick={() => open(index)} className={cn("absolute inset-0", className)} />;
}

type LightboxProps = { photos: Photo[]; index: number; onChange: (i: number) => void; onClose: () => void };

function Lightbox({ photos, index, onChange, onClose }: LightboxProps) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const last = photos.length - 1;

  const go = useCallback((i: number) => onChange(Math.max(0, Math.min(last, i))), [onChange, last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, go, onClose]);

  const onPointerUp = () => {
    if (start.current === null) return;
    if (dx > SWIPE_THRESHOLD) go(index - 1);
    if (dx < -SWIPE_THRESHOLD) go(index + 1);
    start.current = null;
    setDx(0);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[440px] flex-col bg-black" role="dialog" aria-modal="true" aria-label="Photo gallery">
      <header className="relative z-10 flex items-center justify-between px-4 pt-4">
        <span className="glass rounded-full px-3 py-1.5 text-[13px]">
          {index + 1} / {photos.length}
        </span>
        <button type="button" onClick={onClose} aria-label="Close gallery" className="glass flex size-10 items-center justify-center rounded-full">
          <X className="size-5" />
        </button>
      </header>

      <div
        className="relative mt-3 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={(e) => {
          start.current = e.clientX;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 mx-2 overflow-hidden rounded-[var(--radius-card)]"
          style={{ transform: `translateX(${dx}px)`, transition: start.current === null ? "transform 200ms ease-out" : "none" }}
        >
          <PhotoFill key={index} photo={photos[index]} priority />
        </div>
        {index > 0 && (
          <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className="glass absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full">
            <ChevronLeft className="size-5" />
          </button>
        )}
        {index < last && (
          <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className="glass absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full">
            <ChevronRight className="size-5" />
          </button>
        )}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-safe">
        {photos.map((p, i) => (
          <button
            key={p.alt}
            type="button"
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            className={cn("relative size-14 shrink-0 overflow-hidden rounded-xl transition", i === index ? "ring-2 ring-accent" : "opacity-50")}
          >
            <PhotoFill photo={p} />
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
