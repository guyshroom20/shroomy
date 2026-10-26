"use client";

import { ChevronLeft, EllipsisVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Profile } from "@/lib/types";
import { IconButton } from "@/components/ui/IconButton";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusDot } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";

const statusCopy = { available: "Available now", away: "Away", offline: "Offline" } as const;

export function ChatHeader({ profile }: { profile: Profile }) {
  const [menu, setMenu] = useState(false);
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
          </span>
          <span className="flex items-center gap-1.5 text-[13px] text-fg-muted">
            <StatusDot status={profile.availability} className="size-1.5" />
            {statusCopy[profile.availability]}
          </span>
        </span>
      </Link>
      <div className="relative">
        <IconButton label="Conversation options" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
          <EllipsisVertical className="size-5" />
        </IconButton>
        {menu && (
          <ul className="absolute right-0 top-14 w-48 overflow-hidden rounded-2xl bg-surface-2 py-1 text-[15px] shadow-2xl">
            <li><Link href={`/profile/${profile.id}`} className="block px-4 py-2.5 hover:bg-surface-3">View profile</Link></li>
            <li><button type="button" className="w-full px-4 py-2.5 text-left hover:bg-surface-3">Mute</button></li>
            <li><button type="button" className="w-full px-4 py-2.5 text-left hover:bg-surface-3">Block</button></li>
            <li><button type="button" className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-surface-3">Report</button></li>
          </ul>
        )}
      </div>
    </header>
  );
}
