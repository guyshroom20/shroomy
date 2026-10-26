import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { SaveButton } from "@/components/profile/SaveButton";
import { getProfile } from "@/lib/data/profiles";
import { conversations } from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Props = { params: Promise<{ id: string }> };

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();
  const convo = conversations.find((c) => c.profileId === profile.id);
  const messageHref = isSupabaseConfigured
    ? `/messages/start?profile=${profile.id}`
    : convo
      ? `/messages/${convo.id}`
      : "/messages";

  return (
    <ProfileView
      profile={profile}
      actions={
        <>
          <Link
            href={messageHref}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-fg text-[16px] font-medium text-bg"
          >
            <MessageCircle className="size-5" /> Message
          </Link>
          <SaveButton profileId={profile.id} />
        </>
      }
    />
  );
}
