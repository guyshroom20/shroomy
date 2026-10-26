import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: "surface" | "glass" | "like" | "solid";
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: "size-10", md: "size-12", lg: "size-14" };
const variants = {
  surface: "bg-surface-2 text-fg hover:bg-surface-3",
  glass: "glass text-fg",
  like: "bg-like text-white shadow-[0_8px_24px_-6px_var(--like)]",
  solid: "bg-fg text-bg",
};

export function IconButton({ label, variant = "surface", size = "md", className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95",
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
