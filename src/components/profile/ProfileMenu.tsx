"use client";

import { EyeOff, Flag, Share2, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { ReportSheet } from "@/components/ui/ReportSheet";

const item = "flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-3";

/** Copies or natively shares a link to the profile. */
export async function shareProfile(profile: Profile, toast: (m: string) => void) {
  const url = `${window.location.origin}/profile/${profile.id}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `${profile.displayName} on shroom`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    toast("Profile link copied");
  } catch (e) {
    if ((e as Error).name !== "AbortError") toast("Couldn't share this profile");
  }
}

type Props = { profile: Profile; onHide?: () => void; children: (toggle: () => void, open: boolean) => React.ReactNode };

/** Dropdown with profile actions, anchored to whatever trigger `children` renders. */
export function ProfileMenu({ profile, onHide, children }: Props) {
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {children(() => setOpen((o) => !o), open)}
      {open && (
        <ul className="absolute left-0 top-12 z-30 w-52 overflow-hidden rounded-2xl bg-surface-2 py-1 text-[15px] shadow-2xl">
          <li>
            <Link href={`/profile/${profile.id}`} className={item}>
              <UserRound className="size-4 text-fg-muted" /> View profile
            </Link>
          </li>
          <li>
            <button type="button" className={item} onClick={() => { setOpen(false); shareProfile(profile, toast); }}>
              <Share2 className="size-4 text-fg-muted" /> Share profile
            </button>
          </li>
          {onHide && (
            <li>
              <button type="button" className={item} onClick={() => { setOpen(false); onHide(); toast(`You won't see ${profile.displayName} for now`); }}>
                <EyeOff className="size-4 text-fg-muted" /> Not interested
              </button>
            </li>
          )}
          <li>
            <button type="button" className={`${item} text-red-400`} onClick={() => { setOpen(false); setReport(true); }}>
              <Flag className="size-4" /> Report
            </button>
          </li>
        </ul>
      )}
      <ReportSheet open={report} onClose={() => setReport(false)} name={profile.displayName} />
    </div>
  );
}
