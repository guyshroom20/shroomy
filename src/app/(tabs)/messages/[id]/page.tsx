import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";
import { requireAccount } from "@/lib/auth";
import { toMessage } from "@/lib/data/chat";
import { getThread } from "@/lib/data/conversations";
import { getConversation, getProfile } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
};

export default async function ConversationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { draft } = await searchParams;

  if (isSupabaseConfigured) {
    const me = await requireAccount(`/messages/${id}`);
    const thread = await getThread(id, me.id);
    if (!thread?.profile) notFound();
    return (
      <ChatThread
        profile={thread.profile}
        initialMessages={thread.rows.map((r) => toMessage(r, me.id))}
        draft={draft}
        live={{ conversationId: id, me: me.id, partnerId: thread.partnerId, blocked: thread.blockedByMe }}
      />
    );
  }

  const conversation = getConversation(id);
  const profile = conversation && getProfile(conversation.profileId);
  if (!conversation || !profile) notFound();
  return <ChatThread profile={profile} initialMessages={conversation.messages} draft={draft} />;
}
