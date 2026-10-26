import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database, Tables } from "@/lib/supabase/database.types";
import type { Message } from "@/lib/types";

type MessageRow = Tables<"messages">;
export type InboxRow = Database["public"]["Functions"]["my_conversations"]["Returns"][number];
export type ReportReason = Database["public"]["Enums"]["report_reason"];

export const toMessage = (row: MessageRow, me: string): Message => ({
  id: String(row.id),
  fromMe: row.sender_id === me,
  text: row.body,
  sentAt: row.created_at,
  status: row.sender_id === me ? (row.read_at ? "read" : "delivered") : undefined,
});

/** The inbox: one row per conversation, newest first. */
export async function fetchInbox(): Promise<InboxRow[]> {
  const { data, error } = await createClient().rpc("my_conversations");
  if (error) throw error;
  return data;
}

/** Opens (or reopens) a conversation with a listing. Visitors only, after the age check. */
export async function startConversation(listingId: string): Promise<string> {
  const { data, error } = await createClient().rpc("start_conversation", { p_listing_id: listingId });
  if (error) throw error;
  return data;
}

export async function fetchMessages(conversationId: string, before?: number, limit = 50) {
  let query = createClient()
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("id", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("id", before);
  const { data, error } = await query;
  if (error) throw error;
  return data.reverse();
}

export async function sendMessage(conversationId: string, body: string) {
  const { data, error } = await createClient()
    .from("messages")
    .insert({ conversation_id: conversationId, body })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markRead(conversationId: string) {
  const { error } = await createClient().rpc("mark_conversation_read", { p_conversation_id: conversationId });
  if (error) throw error;
}

/**
 * Live updates for one conversation: new messages, and read receipts on
 * messages already sent. Row-level security means only participants get events.
 * Returns an unsubscribe function.
 */
export function subscribeToConversation(
  conversationId: string,
  handlers: { onInsert: (row: MessageRow) => void; onUpdate?: (row: MessageRow) => void },
) {
  const supabase = createClient();
  const filter = `conversation_id=eq.${conversationId}`;
  const channel: RealtimeChannel = supabase
    .channel(`conversation:${conversationId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter }, (p) =>
      handlers.onInsert(p.new as MessageRow),
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter }, (p) =>
      handlers.onUpdate?.(p.new as MessageRow),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function blockAccount(accountId: string) {
  const { error } = await createClient()
    .from("blocks")
    .upsert({ blocked_id: accountId }, { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function unblockAccount(accountId: string) {
  const { error } = await createClient().from("blocks").delete().eq("blocked_id", accountId);
  if (error) throw error;
}

/** Report a listing, a photo or a message. Signed-out users can report listings and photos. */
export async function submitReport(
  reason: ReportReason,
  target: { listingId: string } | { photoId: string } | { messageId: number },
  details?: string,
) {
  const { error } = await createClient().rpc("submit_report", {
    p_reason: reason,
    p_details: details,
    p_listing_id: "listingId" in target ? target.listingId : undefined,
    p_photo_id: "photoId" in target ? target.photoId : undefined,
    p_message_id: "messageId" in target ? target.messageId : undefined,
  });
  if (error) throw error;
}
