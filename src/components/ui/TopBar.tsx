"use client";

import { AlignLeft, Flame, MapPin, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { activeChips, useFilteredProfiles, useFilters } from "@/lib/filters";
import { profiles } from "@/lib/mock-data";
import { FilterSheet } from "./FilterSheet";
import { IconButton } from "./IconButton";
import { MenuDrawer } from "./MenuDrawer";
import { SegmentedControl } from "./SegmentedControl";

/** Header for the For You / Nearby views. */
export function DiscoverTopBar() {
  const path = usePathname();
  const nearby = path.startsWith("/nearby");
  const [menu, setMenu] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { filters } = useFilters();
  const results = useFilteredProfiles(profiles);
  const activeCount = activeChips(filters).length;
  return (
    <header className="relative z-20 flex items-center justify-between px-4 pt-4">
      <IconButton label="Menu" onClick={() => setMenu(true)}>
        <AlignLeft className="size-5" />
      </IconButton>
      <SegmentedControl
        segments={[
          { href: "/", label: "For You", icon: <Flame className="size-4" fill={nearby ? "none" : "currentColor"} />, active: !nearby },
          { href: "/nearby", label: "Nearby", icon: <MapPin className="size-4" fill={nearby ? "currentColor" : "none"} />, active: nearby },
        ]}
      />
      <IconButton label={activeCount ? `Filters (${activeCount} on)` : "Filters"} onClick={() => setFiltersOpen(true)} className="relative">
        <SlidersHorizontal className="size-5" />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-accent-fg">
            {activeCount}
          </span>
        )}
      </IconButton>
      <MenuDrawer open={menu} onClose={() => setMenu(false)} />
      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} resultCount={results.length} />
    </header>
  );
}
