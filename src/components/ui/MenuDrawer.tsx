"use client";

import { Bookmark, Compass, Flame, Heart, MapPin, MessageCircle, RotateCcw, ShieldCheck, Store, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFilters } from "@/lib/filters";
import { useMyListing } from "@/lib/my-listing";
import { useSaved } from "@/lib/saved";
import { useToast } from "@/lib/toast";
import { Sheet } from "./Sheet";

const links = [
  { href: "/", label: "For You", icon: Flame },
  { href: "/nearby", label: "Nearby", icon: MapPin },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
];

const tips = [
  "Keep chats on the platform until you're comfortable.",
  "Never send money, gift cards or ID to someone you haven't met.",
  "Meet somewhere public first and tell a friend where you'll be.",
  "Report anything that feels off. Reports are confidential.",
];

const row = "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[16px] hover:bg-surface-2";

export function MenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [safety, setSafety] = useState(false);
  const { reset, savedSearches, applySearch } = useFilters();
  const { listing } = useMyListing();
  const router = useRouter();
  const { saved, clear } = useSaved();
  const toast = useToast();

  return (
    <>
      <Sheet open={open} onClose={onClose} title="shroom" side="left">
        <nav>
          <ul>
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} onClick={onClose} className={row}>
                  <Icon className="size-5 text-fg-muted" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className="my-3 border-line" />
        <Link href={listing ? "/me" : "/me/edit"} onClick={onClose} className={row}>
          <Store className="size-5 text-accent" />
          <span className="flex-1">My listing</span>
          {!listing && <span className="text-[13px] text-fg-subtle">Create</span>}
        </Link>
        {savedSearches.length > 0 && (
          <>
            <hr className="my-3 border-line" />
            <h3 className="px-3 pb-1 text-[13px] uppercase tracking-wide text-fg-subtle">Saved searches</h3>
            {savedSearches.map((s) => (
              <button
                key={s.id}
                type="button"
                className={row}
                onClick={() => {
                  applySearch(s.id);
                  onClose();
                  router.push("/explore");
                  toast(`Applied “${s.name}”`);
                }}
              >
                <Bookmark className="size-5 text-fg-muted" /> {s.name}
              </button>
            ))}
          </>
        )}
        <hr className="my-3 border-line" />
        <button type="button" className={row} onClick={() => setSafety(true)}>
          <ShieldCheck className="size-5 text-verified" /> Safety tips
        </button>
        <button
          type="button"
          className={row}
          onClick={() => {
            reset();
            toast("Filters reset");
          }}
        >
          <RotateCcw className="size-5 text-fg-muted" /> Reset filters
        </button>
        <button
          type="button"
          className={row}
          disabled={saved.size === 0}
          onClick={() => {
            clear();
            toast("Saved list cleared");
          }}
        >
          <Trash2 className="size-5 text-fg-muted" /> Clear saved ({saved.size})
        </button>
      </Sheet>

      <Sheet open={safety} onClose={() => setSafety(false)} title="Safety tips">
        <ol className="space-y-3">
          {tips.map((t, i) => (
            <li key={t} className="flex gap-3 rounded-2xl bg-surface-2 p-4 text-[15px] leading-snug">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-semibold text-accent-fg">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </Sheet>
    </>
  );
}
