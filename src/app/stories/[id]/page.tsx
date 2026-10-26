import { notFound } from "next/navigation";
import { StoryViewer } from "@/components/story/StoryViewer";
import { conversations, profiles } from "@/lib/mock-data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return profiles.filter((p) => p.story).map((p) => ({ id: p.story!.id }));
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const profile = profiles.find((p) => p.story?.id === id);
  if (!profile?.story) notFound();
  const convo = conversations.find((c) => c.profileId === profile.id);
  return <StoryViewer story={profile.story} profile={profile} replyHref={`/messages/${convo?.id ?? ""}`} />;
}
