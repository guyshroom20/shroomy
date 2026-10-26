import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Conversation, Profile } from "@/lib/types";
import { getProfilesByListingIds, visitorProfile } from "./listings";

// Server-side reads for the inbox and conversation screens. Row-level
// security limits everything here to the signed-in user's own chats.

export type InboxItem = { conversation: Conversation; profile: Profile };

export async function getInbox(): Promise<InboxItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_conversations");
  if (error) throw error;
  const listings = await getProfilesByListingIds([...new Set(data.map((r) => r.listing_id))]);
  return data.map((r) => ({
    conversation: {
      id: r.conversation_id,
      profileId: r.listing_slug,
      unread: Number(r.unread_count),
      messages: [
        {
          id: r.conversation_id,
          fromMe: Boolean(r.last_message_from_me),
          text: r.last_message ?? "Say hello",
          sentAt: r.last_message_at,
        },
      ],
    },
    profile: r.is_advertiser ? visitorProfile(r.partner_id, r.partner_name) : (listings.get(r.listing_id) ?? visitorProfile(r.partner_id, r.partner_name)),
  }));
}

export async function getUnreadCount() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_conversations");
  return (data ?? []).reduce((n, r) => n + Number(r.unread_count), 0);
}

export async function getThread(conversationId: string, me: string) {
  const supabase = await createClient();
  const { data: convo } = await supabase.from("conversations").select("*").eq("id", conversationId).maybeSingle();
  if (!convo) return null;
  const iAmAdvertiser = convo.advertiser_id === me;
  const partnerId = iAmAdvertiser ? convo.visitor_id : convo.advertiser_id;

  const [{ data: rows }, { data: block }, profile] = await Promise.all([
    supabase.from("messages").select("*").eq("conversation_id", conversationId).order("id", { ascending: false }).limit(100),
    supabase.from("blocks").select("blocked_id").eq("blocked_id", partnerId).maybeSingle(),
    iAmAdvertiser
      ? supabase.rpc("my_conversations").then(({ data }) => {
          const row = data?.find((r) => r.conversation_id === conversationId);
          return visitorProfile(partnerId, row?.partner_name ?? "Visitor");
        })
      : getProfilesByListingIds([convo.listing_id]).then((m) => m.get(convo.listing_id)),
  ]);

  return {
    conversationId,
    partnerId,
    blockedByMe: Boolean(block),
    profile,
    rows: (rows ?? []).reverse(),
  };
}
