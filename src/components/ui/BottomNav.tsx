"use client";

import { Compass, Heart, Home, MessageCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" || p.startsWith("/nearby") },
  { href: "/explore", label: "Explore", icon: Compass, match: (p: string) => p.startsWith("/explore") },
  { href: "/saved", label: "Saved", icon: Heart, match: (p: string) => p.startsWith("/saved") },
  { href: "/messages", label: "Messages", icon: MessageCircle, match: (p: string) => p.startsWith("/messages") },
];

export function BottomNav({ unread = 0 }: { unread?: number }) {
  const path = usePathname();
  // Hidden inside a conversation, where the composer takes the bottom edge.
  if (/^\/messages\/.+/.test(path)) return null;
  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-safe">
      <ul className="glass pointer-events-auto flex items-center gap-1 rounded-full p-1.5">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(path);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-full transition-all",
                  active ? "w-20 bg-fg text-bg" : "w-12 text-fg-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" fill={active ? "currentColor" : "none"} strokeWidth={active ? 2.2 : 1.8} />
                {label === "Messages" && unread > 0 && (
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-like" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
