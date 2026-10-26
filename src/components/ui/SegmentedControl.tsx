"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

type Segment = { href: string; label: string; icon: React.ReactNode; active: boolean };

export function SegmentedControl({ segments }: { segments: Segment[] }) {
  return (
    <nav className="flex items-center rounded-full bg-surface p-1">
      {segments.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={s.active ? "page" : undefined}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[15px] transition",
            s.active ? "bg-surface-3 text-fg" : "text-fg-muted hover:text-fg",
          )}
        >
          {s.icon}
          {s.label}
        </Link>
      ))}
    </nav>
  );
}
