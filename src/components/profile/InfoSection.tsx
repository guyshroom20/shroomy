"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = { title: string; children: React.ReactNode; collapsible?: boolean };

export function InfoSection({ title, children, collapsible }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[28px] bg-surface p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-[22px] font-medium tracking-[-0.02em]">{title}</h2>
        {collapsible && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? "Collapse" : "Expand"}>
            <ChevronDown className={cn("size-5 text-fg-muted transition", open && "rotate-180")} />
          </button>
        )}
      </header>
      <div className={cn("mt-3 text-[15px] leading-relaxed text-fg-muted", collapsible && !open && "line-clamp-4")}>
        {children}
      </div>
    </section>
  );
}
