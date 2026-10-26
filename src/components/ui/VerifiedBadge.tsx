import { cn } from "@/lib/cn";

/** Rosette tick shown on ID-verified profiles. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-label="ID verified" className={cn("size-6 text-verified", className)}>
      <path
        fill="currentColor"
        d="M12 1.5l2.6 1.9 3.2-.2 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.2z"
      />
      <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M8 12.3l2.6 2.6L16.2 9.3" />
    </svg>
  );
}
