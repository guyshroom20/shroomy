"use client";

import { BellOff, ChevronLeft, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { ReportSheet } from "@/components/ui/ReportSheet";
import { StatusDot } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

const statusCopy = { available: "Available now", away: "Away", offline: "Offline" } as const;

type Props = {
  profile: Profile;
  muted: boolean;
  blocked: boolean;
  onToggleMute: () => void;
  onToggleBlock: () => void;
};

export function ChatHeader({ profile, muted, blocked, onToggleMute, onToggleBlock }: Props) {
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);

  const pick = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 px-4 pb-3 pt-4">
      <Link href="/messages" aria-label="Back to messages" className="flex size-12 items-center justify-center rounded-full bg-surface-2">
        <ChevronLeft className="size-5" />
      </Link>
      <Link href={`/profile/${profile.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full">
          <PhotoFill photo={profile.photos[0]} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="flex items-center gap-1.5 text-[17px] font-medium">
            <span className="truncate">{profile.displayName}, {profile.age}</span>
            {profile.verified && <VerifiedBadge className="size-4" />}
            {muted && <BellOff className="size-3.5 text-fg-muted" aria-label="Muted" />}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-fg-muted">
            <StatusDot status={profile.availability} className="size-1.5" />
            {statusCopy[profile.availability]}
          </span>
        </span>
      </Link>
      <div ref={ref} className="relative">
        <IconButton label="Conversation options" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <EllipsisVertical className="size-5" />
        </IconButton>
        {menu && (
          <ul className="absolute right-0 top-14 w-48 overflow-hidden rounded-2xl bg-surface-2 py-1 text-[15px] shadow-2xl">
            <li><Link href={`/profile/${profile.id}`} className="block px-4 py-2.5 hover:bg-surface-3">View profile</Link></li>
            <li><button type="button" onClick={pick(onToggleMute)} className="w-full px-4 py-2.5 text-left hover:bg-surface-3">{muted ? "Unmute" : "Mute"}</button></li>
            <li><button type="button" onClick={pick(onToggleBlock)} className="w-full px-4 py-2.5 text-left hover:bg-surface-3">{blocked ? "Unblock" : "Block"}</button></li>
            <li><button type="button" onClick={pick(() => setReport(true))} className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-surface-3">Report</button></li>
          </ul>
        )}
      </div>
      <ReportSheet open={report} onClose={() => setReport(false)} name={profile.displayName} />
    </header>
  );
}
