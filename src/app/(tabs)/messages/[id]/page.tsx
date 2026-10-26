import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/ChatThread";
import { conversations, getConversation, getProfile } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ draft?: string }>;
};

export function generateStaticParams() {
  return conversations.map((c) => ({ id: c.id }));
}

export default async function ConversationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { draft } = await searchParams;
  const conversation = getConversation(id);
  const profile = conversation && getProfile(conversation.profileId);
  if (!conversation || !profile) notFound();
  return <ChatThread profile={profile} initialMessages={conversation.messages} draft={draft} />;
}
