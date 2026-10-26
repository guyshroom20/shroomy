"use client";

import { ArrowUp, AudioLines, Heart, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Profile, Story } from "@/lib/types";
import { useSaved } from "@/lib/saved";
import { PhotoFill } from "@/components/ui/PhotoFill";
import { StatusDot } from "@/components/ui/StatusPill";
import { cn } from "@/lib/cn";

const SLIDE_MS = 5000;

type Props = { story: Story; profile: Profile; replyHref: string };

/** Full-screen story with progress bars, tap zones and a reply box. */
export function StoryViewer({ story, profile, replyHref }: Props) {
  const [slide, setSlide] = useState(0);
  const [reply, setReply] = useState("");
  const router = useRouter();
  const { isSaved, toggle } = useSaved();

  useEffect(() => {
    const t = setTimeout(() => {
      if (slide < story.slides.length - 1) setSlide((s) => s + 1);
    }, SLIDE_MS);
    return () => clearTimeout(t);
  }, [slide, story.slides.length]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    router.push(`${replyHref}${replyHref.includes("?") ? "&" : "?"}draft=${encodeURIComponent(reply)}`);
  };

  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <PhotoFill key={slide} photo={story.slides[slide]} priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

      {/* Tap zones for previous/next. */}
      <button type="button" aria-label="Previous" className="absolute inset-y-0 left-0 z-10 w-1/3" onClick={() => setSlide((s) => Math.max(0, s - 1))} />
      <button type="button" aria-label="Next" className="absolute inset-y-0 right-0 z-10 w-1/3" onClick={() => setSlide((s) => Math.min(story.slides.length - 1, s + 1))} />

      <div className="relative z-20 px-4 pt-3">
        <div className="flex gap-1.5">
          {story.slides.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
              <div
                className={cn("h-full rounded-full bg-accent", i < slide && "w-full", i > slide && "w-0")}
                style={i === slide ? { animation: `story-progress ${SLIDE_MS}ms linear forwards` } : undefined}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Link href={`/profile/${profile.id}`} className="glass flex items-center gap-3 rounded-full py-1.5 pl-1.5 pr-5">
            <span className="relative size-10 overflow-hidden rounded-full">
              <PhotoFill photo={profile.photos[0]} />
            </span>
            <span className="leading-tight">
              <span className="flex items-center gap-1.5 text-[15px]">
                {profile.displayName} {profile.age}
                <StatusDot status={profile.availability} className="size-1.5" />
              </span>
              {story.nowPlaying && (
                <span className="flex items-center gap-1 text-[12px] text-fg/80">
                  <AudioLines className="size-3" />
                  {story.nowPlaying}
                </span>
              )}
            </span>
          </Link>
          <button type="button" aria-label="Close" onClick={() => router.back()} className="glass flex size-10 items-center justify-center rounded-full">
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-10 max-w-[18ch] text-[44px] font-extrabold uppercase leading-[0.95] tracking-[-0.06em] [text-wrap:balance]">
          {story.caption}
        </p>
      </div>

      <form onSubmit={send} className="relative z-20 mt-auto flex items-center gap-3 px-4 pb-safe">
        <div className="glass flex flex-1 items-center rounded-full py-1.5 pl-5 pr-1.5">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Send a reply…"
            aria-label="Reply to story"
            className="min-w-0 flex-1 bg-transparent text-[15px] placeholder:text-fg/60 focus:outline-none"
          />
          <button type="submit" aria-label="Send" className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-fg">
            <ArrowUp className="size-5" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Save"
          aria-pressed={isSaved(profile.id)}
          onClick={() => toggle(profile.id)}
          className="glass flex size-14 items-center justify-center rounded-full"
        >
          <Heart className={cn("size-6", isSaved(profile.id) ? "text-like" : "text-white")} fill="currentColor" />
        </button>
      </form>
    </div>
  );
}
