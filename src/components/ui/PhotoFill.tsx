import type { Photo } from "@/lib/types";
import { cn } from "@/lib/cn";

type Props = { photo: Photo; className?: string; priority?: boolean };

/** Fills its parent with a photo, or a tinted gradient while no image exists. */
export function PhotoFill({ photo, className, priority }: Props) {
  const [from, to] = photo.tint;
  return (
    <div
      className={cn("absolute inset-0", className)}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${from}, ${to})` }}
    >
      {photo.src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.src}
          alt={photo.alt}
          loading={priority ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
