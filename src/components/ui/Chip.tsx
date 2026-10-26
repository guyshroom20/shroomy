import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  onRemove?: () => void;
  icon?: React.ReactNode;
  className?: string;
};

export function Chip({ children, onRemove, icon, className }: Props) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 text-[14px] text-fg", className)}>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${children}`} className="-ml-0.5 text-fg-muted hover:text-fg">
          <X className="size-3.5" />
        </button>
      )}
      {icon}
      {children}
    </span>
  );
}
