"use client";

import { AlignLeft, Flame, MapPin, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { IconButton } from "./IconButton";
import { SegmentedControl } from "./SegmentedControl";

/** Header for the For You / Nearby views. */
export function DiscoverTopBar() {
  const path = usePathname();
  const nearby = path.startsWith("/nearby");
  return (
    <header className="relative z-20 flex items-center justify-between px-4 pt-4">
      <IconButton label="Menu">
        <AlignLeft className="size-5" />
      </IconButton>
      <SegmentedControl
        segments={[
          { href: "/", label: "For You", icon: <Flame className="size-4" fill={nearby ? "none" : "currentColor"} />, active: !nearby },
          { href: "/nearby", label: "Nearby", icon: <MapPin className="size-4" fill={nearby ? "currentColor" : "none"} />, active: nearby },
        ]}
      />
      <IconButton label="Filters">
        <SlidersHorizontal className="size-5" />
      </IconButton>
    </header>
  );
}
