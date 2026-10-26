"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ProfileTile } from "@/components/profile/ProfileTile";
import { Chip } from "@/components/ui/Chip";
import { IconButton } from "@/components/ui/IconButton";
import { exploreFilters, profiles } from "@/lib/mock-data";

export default function ExplorePage() {
  const [filters, setFilters] = useState(exploreFilters);
  return (
    <main className="pb-32">
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Explore</h1>
        <IconButton label="Filters">
          <SlidersHorizontal className="size-5" />
        </IconButton>
      </header>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {filters.map((f) => (
          <Chip key={f.id} onRemove={() => setFilters((fs) => fs.filter((x) => x.id !== f.id))}>
            {f.label}
          </Chip>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 px-2">
        {profiles.map((p) => (
          <ProfileTile key={p.id} profile={p} />
        ))}
      </div>
    </main>
  );
}
