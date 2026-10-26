import { Search } from "lucide-react";
import Link from "next/link";
import { ConversationRow } from "@/components/chat/ConversationRow";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { conversations, getProfile, profiles } from "@/lib/mock-data";

export default function MessagesPage() {
  const withStories = profiles.filter((p) => p.story);
  return (
    <main className="pb-32">
      <header className="px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Messages</h1>
        <label className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-3 text-fg-muted">
          <Search className="size-4" />
          <input placeholder="Search" className="flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none" />
        </label>
      </header>

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

      <ul className="mt-4 px-3">
        {conversations.map((c) => {
          const profile = getProfile(c.profileId);
          return profile ? (
            <li key={c.id}>
              <ConversationRow conversation={c} profile={profile} />
            </li>
          ) : null;
        })}
      </ul>
    </main>
  );
}
