"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { ProfileTile } from "@/components/profile/ProfileTile";
import { Chip } from "@/components/ui/Chip";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { IconButton } from "@/components/ui/IconButton";
import { activeChips, useFilteredProfiles, useFilters } from "@/lib/filters";
import { profiles } from "@/lib/mock-data";

export default function ExplorePage() {
  const [sheet, setSheet] = useState(false);
  const { filters, update, reset } = useFilters();
  const results = useFilteredProfiles(profiles);
  const chips = activeChips(filters);
  return (
    <main className="pb-32">
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Explore</h1>
        <IconButton label="Filters" onClick={() => setSheet(true)}>
          <SlidersHorizontal className="size-5" />
        </IconButton>
      </header>
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-5">
        {chips.length === 0 ? (
          <button type="button" onClick={() => setSheet(true)} className="shrink-0 rounded-full bg-surface-2 px-3.5 py-2 text-[14px] text-fg-muted">
            All profiles · Add filters
          </button>
        ) : (
          chips.map((c) => (
            <Chip key={c.id} onRemove={() => update(c.clear)}>
              {c.label}
            </Chip>
          ))
        )}
      </div>
      {results.length === 0 ? (
        <div className="mx-5 mt-10 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
          <p className="text-[17px]">No profiles match these filters</p>
          <button type="button" onClick={reset} className="mt-6 rounded-full bg-fg px-5 py-3 text-[15px] font-medium text-bg">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2 px-2">
          {results.map((p) => (
            <ProfileTile key={p.id} profile={p} />
          ))}
        </div>
      )}
      <FilterSheet open={sheet} onClose={() => setSheet(false)} resultCount={results.length} />
    </main>
  );
}
