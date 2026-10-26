"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Bottom sheet by default; "left" slides in as a side drawer. */
  side?: "bottom" | "left";
};

/**
 * Modal panel over the phone column. Closes on backdrop tap or Escape.
 * Portalled to <body> so transformed ancestors (the swipe card) can't trap it.
 */
export function Sheet({ open, onClose, title, children, side = "bottom" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 mx-auto flex max-w-[440px]" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/60" />
      <div
        className={cn(
          "relative flex flex-col overflow-y-auto bg-surface p-5",
          side === "bottom" ? "mt-auto max-h-[85dvh] w-full rounded-t-[28px] pb-safe" : "h-full w-[82%] rounded-r-[28px]",
        )}
      >
        <header className="mb-4 flex items-center justify-between">
          <h2 className="text-[22px] font-medium tracking-[-0.02em]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex size-10 items-center justify-center rounded-full bg-surface-2">
            <X className="size-5" />
          </button>
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
