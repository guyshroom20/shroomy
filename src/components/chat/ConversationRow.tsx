import Link from "next/link";
import type { Conversation, Profile } from "@/lib/types";
import { formatRelative } from "@/lib/format";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusDot } from "@/components/ui/StatusPill";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { cn } from "@/lib/cn";

export function ConversationRow({ conversation, profile }: { conversation: Conversation; profile: Profile }) {
  const last = conversation.messages[conversation.messages.length - 1];
  const unread = conversation.unread > 0;
  return (
    <Link href={`/messages/${conversation.id}`} className="flex items-center gap-3 rounded-3xl p-2 transition hover:bg-surface">
      <span className="relative shrink-0">
        <span className="relative block size-14 overflow-hidden rounded-full">
          <PhotoFill photo={profile.photos[0]} />
        </span>
        <StatusDot status={profile.availability} className="absolute bottom-0.5 right-0.5 size-3 ring-2 ring-bg" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={cn("truncate text-[16px]", unread && "font-semibold")}>{profile.displayName}</span>
          {profile.verified && <VerifiedBadge className="size-4" />}
          <span className="ml-auto shrink-0 text-[12px] text-fg-subtle">{formatRelative(last.sentAt)}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={cn("truncate text-[14px]", unread ? "text-fg" : "text-fg-muted")}>
            {last.fromMe && "You: "}
            {last.text}
          </span>
          {unread && (
            <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-fg">
              {conversation.unread}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
