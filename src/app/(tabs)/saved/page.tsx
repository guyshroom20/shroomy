"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProfileTile } from "@/components/profile/ProfileTile";
import { useProfiles } from "@/lib/profiles";
import { useSaved } from "@/lib/saved";

export default function SavedPage() {
  const { saved } = useSaved();
  const profiles = useProfiles();
  const list = profiles.filter((p) => saved.has(p.id));
  return (
    <main className="pb-32">
      <header className="px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Saved</h1>
      </header>
      {list.length === 0 ? (
        <div className="mx-5 mt-10 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-surface-2">
            <Heart className="size-7 text-like" fill="currentColor" />
          </span>
          <p className="mt-4 text-[17px]">No one saved yet</p>
          <p className="mt-1 text-[14px] text-fg-muted">Tap the heart on a profile to keep it here.</p>
          <Link href="/explore" className="mt-6 rounded-full bg-fg px-5 py-3 text-[15px] font-medium text-bg">
            Explore profiles
          </Link>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2 px-2">
          {list.map((p) => (
            <ProfileTile key={p.id} profile={p} />
          ))}
        </div>
      )}
    </main>
  );
}
