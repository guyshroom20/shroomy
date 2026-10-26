import { notFound } from "next/navigation";
import { StoryViewer } from "@/components/story/StoryViewer";
import { getProfiles } from "@/lib/data/profiles";
import { conversations } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = { params: Promise<{ id: string }> };

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const profile = (await getProfiles()).find((p) => p.story?.id === id);
  if (!profile?.story) notFound();
  const convo = conversations.find((c) => c.profileId === profile.id);
  const replyHref = isSupabaseConfigured ? `/messages/start?profile=${profile.id}` : `/messages/${convo?.id ?? ""}`;
  return <StoryViewer story={profile.story} profile={profile} replyHref={replyHref} />;
}
