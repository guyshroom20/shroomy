import Link from "next/link";
import { InboxList } from "@/components/chat/InboxList";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { conversations, getProfile, profiles } from "@/lib/mock-data";

export default function MessagesPage() {
  const withStories = profiles.filter((p) => p.story);
  const items = conversations.flatMap((c) => {
    const profile = getProfile(c.profileId);
    return profile ? [{ conversation: c, profile }] : [];
  });
  return (
    <main className="pb-32">
      <header className="px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Messages</h1>
      </header>

      <InboxList items={items}>
        <section aria-label="Stories" className="no-scrollbar mt-5 flex gap-4 overflow-x-auto px-5">
          {withStories.map((p) => (
            <Link key={p.id} href={`/stories/${p.story!.id}`} className="flex shrink-0 flex-col items-center gap-1.5">
              <span className="rounded-full bg-accent p-[3px]">
                <span className="relative block size-16 overflow-hidden rounded-full border-[3px] border-bg">
                  <PhotoFill photo={p.photos[0]} />
                </span>
              </span>
              <span className="text-[12px] text-fg-muted">{p.displayName}</span>
            </Link>
          ))}
        </section>
      </InboxList>
    </main>
  );
}
