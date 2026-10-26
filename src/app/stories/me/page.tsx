"use client";

import { notFound } from "next/navigation";
import { StoryViewer } from "@/components/story/StoryViewer";
import { useMyListing } from "@/lib/my-listing";

export default function MyStoryPage() {
  const { profile, loaded } = useMyListing();
  if (!loaded) return null;
  if (!profile?.story) notFound();
  return <StoryViewer story={profile.story} profile={profile} replyHref="/me" />;
}
