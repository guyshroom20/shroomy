"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { ProfileTile } from "@/components/profile/ProfileTile";
import { Chip } from "@/components/ui/Chip";
import { FilterSheet } from "@/components/ui/FilterSheet";
import { IconButton } from "@/components/ui/IconButton";
import { activeChips, useFilteredProfiles, useFilters } from "@/lib/filters";
import { useProfiles } from "@/lib/profiles";

export default function ExplorePage() {
  const [sheet, setSheet] = useState(false);
  const { filters, update, reset } = useFilters();
  const profiles = useProfiles();
  const results = useFilteredProfiles(profiles);
  const chips = activeChips(filters);
  return (
    <main className="pb-32">
      <header className="flex items-center justify-between px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Explore</h1>
        <IconButton label={chips.length ? `Filters (${chips.length} on)` : "Filters"} onClick={() => setSheet(true)} className="relative">
          <SlidersHorizontal className="size-5" />
          {chips.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-fg">
              {chips.length}
            </span>
          )}
        </IconButton>
      </header>

      <div className="px-5">
        <label className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-3 text-fg-muted focus-within:ring-2 focus-within:ring-accent">
          <Search className="size-4" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
            placeholder="Search names, areas, interests"
            aria-label="Search profiles"
            className="flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query && (
            <button type="button" aria-label="Clear search" onClick={() => update({ query: "" })} className="text-fg-muted hover:text-fg">
              <X className="size-4" />
            </button>
          )}
        </label>
      </div>

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-5">
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

      <p className="mt-4 px-5 text-[13px] text-fg-muted" aria-live="polite">
        {results.length} {results.length === 1 ? "profile" : "profiles"}
      </p>

      {results.length === 0 ? (
        <div className="mx-5 mt-4 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
          <p className="text-[17px]">No profiles match</p>
          <p className="mt-1 text-[14px] text-fg-muted">Try a different search or fewer filters.</p>
          <button type="button" onClick={reset} className="mt-6 rounded-full bg-fg px-5 py-3 text-[15px] font-medium text-bg">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2 px-2">
          {results.map((p) => (
            <ProfileTile key={p.id} profile={p} />
          ))}
        </div>
      )}
      <FilterSheet open={sheet} onClose={() => setSheet(false)} profiles={profiles} />
    </main>
  );
}
