import type { Availability } from "@/lib/types";
import { cn } from "@/lib/cn";

const copy: Record<Availability, { label: string; dot: string }> = {
  available: { label: "Available now", dot: "bg-online" },
  away: { label: "Away", dot: "bg-amber-400" },
  offline: { label: "Offline", dot: "bg-fg-subtle" },
};

export function StatusPill({ status, className }: { status: Availability; className?: string }) {
  const { label, dot } = copy[status];
  return (
    <span className={cn("glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-fg", className)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: Availability; className?: string }) {
  return <span aria-label={copy[status].label} className={cn("inline-block size-2 rounded-full", copy[status].dot, className)} />;
}
