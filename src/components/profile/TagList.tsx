import type { Tag } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";

export function TagList({ tags }: { tags: Tag[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <Chip key={t.label} icon={<span aria-hidden>{t.emoji}</span>}>
          {t.label}
        </Chip>
      ))}
    </div>
  );
}
