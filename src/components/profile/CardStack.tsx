"use client";

import { Heart, SearchX, X } from "lucide-react";
import { useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { useFilteredProfiles, useFilters } from "@/lib/filters";
import { useWithMyListing } from "@/lib/my-listing";
import { useSaved } from "@/lib/saved";
import { useToast } from "@/lib/toast";
import { IconButton } from "@/components/ui/IconButton";
import { ProfileCard } from "./ProfileCard";

const SWIPE_THRESHOLD = 110;

/** Swipeable stack: drag right or tap the heart to save, left or the cross to skip. */
export function CardStack({ profiles: all }: { profiles: Profile[] }) {
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const [leaving, setLeaving] = useState<0 | 1 | -1>(0);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const start = useRef(0);
  const { toggle, isSaved } = useSaved();
  const { reset } = useFilters();
  const toast = useToast();
  const profiles = useFilteredProfiles(useWithMyListing(all)).filter((p) => !hidden.has(p.id));

  if (profiles.length === 0) {
    return (
      <div className="mx-5 mt-10 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-surface-2">
          <SearchX className="size-7 text-fg-muted" />
        </span>
        <p className="mt-4 text-[17px]">No one matches right now</p>
        <p className="mt-1 text-[14px] text-fg-muted">Try widening your filters.</p>
        <button
          type="button"
          onClick={() => {
            reset();
            setHidden(new Set());
          }}
          className="mt-6 rounded-full bg-fg px-5 py-3 text-[15px] font-medium text-bg"
        >
          Reset filters
        </button>
      </div>
    );
  }

  const current = profiles[index % profiles.length];
  const next = profiles[(index + 1) % profiles.length];

  const decide = (dir: 1 | -1) => {
    if (dir === 1 && !isSaved(current.id)) {
      toggle(current.id);
      toast(`Saved ${current.displayName}`);
    }
    setLeaving(dir);
    setTimeout(() => {
      setLeaving(0);
      setDrag({ x: 0, active: false });
      setIndex((i) => i + 1);
    }, 220);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // Let taps on buttons and links inside the card through.
    if ((e.target as HTMLElement).closest("a,button")) return;
    start.current = e.clientX;
    setDrag({ x: 0, active: true });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.active) setDrag({ x: e.clientX - start.current, active: true });
  };
  const onPointerUp = () => {
    if (!drag.active) return;
    if (Math.abs(drag.x) > SWIPE_THRESHOLD) decide(drag.x > 0 ? 1 : -1);
    else setDrag({ x: 0, active: false });
  };

  const x = leaving ? leaving * 500 : drag.x;
  const rotate = x / 20;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative mx-4 mt-8 flex-1">
        {/* Peek of the next card behind. */}
        <div className="absolute inset-x-6 -top-4 h-24 overflow-hidden rounded-t-[var(--radius-card)] opacity-60">
          <div className="h-[480px]"><ProfileCard profile={next} interactive={false} /></div>
        </div>

        <div className="absolute inset-0 rounded-[calc(var(--radius-card)+8px)] bg-surface-2 p-2 shadow-2xl">
          <div
            className="relative h-[calc(100%-84px)] touch-pan-y select-none"
            style={{
              transform: `translateX(${x}px) rotate(${rotate}deg)`,
              transition: drag.active && !leaving ? "none" : "transform 220ms ease-out",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <ProfileCard
              key={current.id}
              profile={current}
              onHide={() => setHidden((h) => new Set(h).add(current.id))}
            />
          </div>

          <div className="mt-2 flex justify-center">
            <div className="flex items-center gap-1.5 rounded-full bg-surface p-1.5">
              <IconButton label="Skip" onClick={() => decide(-1)}>
                <X className="size-5" />
              </IconButton>
              <IconButton label="Save" variant="like" onClick={() => decide(1)}>
                <Heart className="size-6" fill="currentColor" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
