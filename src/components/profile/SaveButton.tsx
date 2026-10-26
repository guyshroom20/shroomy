"use client";

import { Heart } from "lucide-react";
import { useSaved } from "@/lib/saved";
import { cn } from "@/lib/cn";

export function SaveButton({ profileId }: { profileId: string }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(profileId);
  return (
    <button
      type="button"
      onClick={() => toggle(profileId)}
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save"}
      className={cn(
        "flex size-14 items-center justify-center rounded-full transition active:scale-95",
        saved ? "bg-like text-white" : "bg-surface-2 text-fg",
      )}
    >
      <Heart className="size-6" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
