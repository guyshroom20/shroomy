import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { SaveButton } from "@/components/profile/SaveButton";
import { conversations, getProfile, profiles } from "@/lib/mock-data";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return profiles.map((p) => ({ id: p.id }));
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const profile = getProfile(id);
  if (!profile) notFound();
  const convo = conversations.find((c) => c.profileId === profile.id);

  return (
    <ProfileView
      profile={profile}
      actions={
        <>
          <Link
            href={convo ? `/messages/${convo.id}` : "/messages"}
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
