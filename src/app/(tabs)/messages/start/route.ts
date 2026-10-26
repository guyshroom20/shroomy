import { NextResponse, type NextRequest } from "next/server";
import { getAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// "Message" on a profile: opens the visitor's conversation with that listing,
// sending them to sign in or take the age check first if needed.
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const slug = request.nextUrl.searchParams.get("profile") ?? "";
  const draft = request.nextUrl.searchParams.get("draft");
  const back = `/profile/${encodeURIComponent(slug)}`;
  const go = (path: string) => NextResponse.redirect(new URL(path, origin), 303);

  const account = await getAccount();
  if (!account) return go(`/sign-in?next=${encodeURIComponent(`/messages/start?profile=${slug}`)}`);
  if (account.role !== "visitor") return go(back);
  if (account.age_assurance !== "passed") return go(`/verify/age?next=${encodeURIComponent(back)}`);

  const supabase = await createClient();
  const { data: listing } = await supabase.from("listings").select("id").eq("slug", slug).maybeSingle();
  if (!listing) return go("/");
  const { data: conversationId, error } = await supabase.rpc("start_conversation", { p_listing_id: listing.id });
  if (error || !conversationId) return go(back);
  return go(`/messages/${conversationId}${draft ? `?draft=${encodeURIComponent(draft)}` : ""}`);
}
