"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Message, Profile } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";

type Props = { profile: Profile; initialMessages: Message[]; draft?: string };

/** Conversation screen. Messages are local state until the realtime backend exists. */
export function ChatThread({ profile, initialMessages, draft }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = ({ text, image }: { text: string; image?: string }) =>
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), fromMe: true, text, image, sentAt: new Date().toISOString(), status: "sent" },
    ]);

  const toggleMute = () => {
    setMuted((v) => !v);
    toast(muted ? "Notifications on" : `Muted ${profile.displayName}`);
  };
  const toggleBlock = () => {
    setBlocked((v) => !v);
    toast(blocked ? `Unblocked ${profile.displayName}` : `Blocked ${profile.displayName}`);
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ChatHeader profile={profile} muted={muted} blocked={blocked} onToggleMute={toggleMute} onToggleBlock={toggleBlock} />
      <div className="flex-1 px-4 pb-4">
        <p className="mx-auto mt-4 flex max-w-xs items-start gap-2 rounded-2xl bg-surface px-4 py-3 text-[13px] leading-snug text-fg-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" />
          Keep chats on the platform. Never send money or ID to someone you haven&apos;t met.
        </p>
        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            first={messages[i - 1]?.fromMe !== m.fromMe}
            last={messages[i + 1]?.fromMe !== m.fromMe}
          />
        ))}
        <div ref={end} />
      </div>
      {blocked ? (
        <div className="glass sticky bottom-0 z-20 flex items-center justify-between gap-3 px-5 pt-4 pb-safe text-[14px] text-fg-muted">
          You blocked {profile.displayName}.
          <button type="button" onClick={toggleBlock} className="rounded-full bg-surface-2 px-4 py-2 text-fg">
            Unblock
          </button>
        </div>
      ) : (
        <Composer onSend={send} initial={draft} />
      )}
    </div>
  );
}
