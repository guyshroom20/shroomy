"use client";

import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReportChoice } from "@/components/ui/ReportSheet";
import {
  blockAccount,
  markRead,
  reportReasonFor,
  sendMessage,
  submitReport,
  subscribeToConversation,
  toMessage,
  unblockAccount,
} from "@/lib/data/chat";
import type { Message, Profile } from "@/lib/types";
import { useToast } from "@/lib/toast";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";

/** Present when the conversation is backed by Supabase; without it the screen runs on local state. */
type Live = { conversationId: string; me: string; partnerId: string; blocked: boolean };

type Props = { profile: Profile; initialMessages: Message[]; draft?: string; live?: Live };

export function ChatThread({ profile, initialMessages, draft, live }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(live?.blocked ?? false);
  const end = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Realtime: add incoming messages, update read receipts, and mark as read while open.
  useEffect(() => {
    if (!live) return;
    const upsert = (m: Message) =>
      setMessages((list) => (list.some((x) => x.id === m.id) ? list.map((x) => (x.id === m.id ? m : x)) : [...list, m]));
    markRead(live.conversationId).catch(() => {});
    return subscribeToConversation(live.conversationId, {
      onInsert: (row) => {
        upsert(toMessage(row, live.me));
        if (row.sender_id !== live.me) markRead(live.conversationId).catch(() => {});
      },
      onUpdate: (row) => upsert(toMessage(row, live.me)),
    });
  }, [live]);

  const send = async ({ text, image }: { text: string; image?: string }) => {
    if (!live) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), fromMe: true, text, image, sentAt: new Date().toISOString(), status: "sent" },
      ]);
      return;
    }
    if (image) toast("Photos in chat are coming soon");
    if (!text) return;
    try {
      const row = await sendMessage(live.conversationId, text);
      setMessages((list) => (list.some((x) => x.id === String(row.id)) ? list : [...list, toMessage(row, live.me)]));
    } catch (e) {
      toast(e instanceof Error && e.message.includes("slow down") ? "You're sending messages too fast" : "Message not sent");
    }
  };

  const report = async (choice: ReportChoice) => {
    if (!live) return;
    const lastFromThem = [...messages].reverse().find((m) => !m.fromMe);
    if (lastFromThem) await submitReport(reportReasonFor(choice), { messageId: Number(lastFromThem.id) });
    else if (profile.listingId) await submitReport(reportReasonFor(choice), { listingId: profile.listingId });
    else throw new Error("Nothing to report yet");
  };

  const toggleMute = () => {
    setMuted((v) => !v);
    toast(muted ? "Notifications on" : `Muted ${profile.displayName}`);
  };
  const toggleBlock = async () => {
    if (live) {
      try {
        await (blocked ? unblockAccount(live.partnerId) : blockAccount(live.partnerId));
      } catch {
        toast("Something went wrong. Try again.");
        return;
      }
    }
    setBlocked((v) => !v);
    toast(blocked ? `Unblocked ${profile.displayName}` : `Blocked ${profile.displayName}`);
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ChatHeader profile={profile} muted={muted} blocked={blocked} onToggleMute={toggleMute} onToggleBlock={toggleBlock} onReport={live ? report : undefined} />
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
