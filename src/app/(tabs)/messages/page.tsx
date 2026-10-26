import Link from "next/link";
import { InboxList } from "@/components/chat/InboxList";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { getAccount } from "@/lib/auth";
import { getInbox } from "@/lib/data/conversations";
import { getProfiles } from "@/lib/data/profiles";
import { conversations, getProfile } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function MessagesPage() {
  const account = isSupabaseConfigured ? await getAccount() : null;
  const withStories = (await getProfiles()).filter((p) => p.story);
  const items = !isSupabaseConfigured
    ? conversations.flatMap((c) => {
        const profile = getProfile(c.profileId);
        return profile ? [{ conversation: c, profile }] : [];
      })
    : account
      ? await getInbox()
      : [];

  return (
    <main className="pb-32">
      <header className="px-5 pt-6">
        <h1 className="text-[40px] font-medium tracking-[-0.04em]">Messages</h1>
      </header>

      {isSupabaseConfigured && !account ? (
        <div className="mx-5 mt-10 flex flex-col items-center rounded-[28px] bg-surface px-6 py-12 text-center">
          <p className="text-[17px]">Sign in to see your messages</p>
          <Link href="/sign-in?next=/messages" className="mt-6 rounded-full bg-fg px-5 py-3 text-[15px] font-medium text-bg">
            Sign in
          </Link>
        </div>
      ) : (
        <InboxList items={items}>
          {withStories.length > 0 && (
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
          )}
        </InboxList>
      )}
    </main>
  );
}
