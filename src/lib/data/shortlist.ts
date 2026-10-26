import { createClient } from "@/lib/supabase/client";

// Shortlist for signed-in users. Profiles are addressed by slug, as in the UI.

export async function fetchShortlist(): Promise<string[]> {
  const { data, error } = await createClient().from("shortlist").select("listings(slug)").order("created_at", { ascending: false });
  if (error) throw error;
  return data.flatMap((r) => (r.listings ? [r.listings.slug] : []));
}

async function listingId(slug: string) {
  const { data, error } = await createClient().from("listings").select("id").eq("slug", slug).single();
  if (error) throw error;
  return data.id;
}

export async function addToShortlist(slug: string) {
  const { error } = await createClient()
    .from("shortlist")
    .upsert({ listing_id: await listingId(slug) }, { onConflict: "account_id,listing_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFromShortlist(slug: string) {
  const { error } = await createClient().from("shortlist").delete().eq("listing_id", await listingId(slug));
  if (error) throw error;
}
