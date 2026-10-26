"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ListingFormState = { error?: string; saved?: boolean };

const availabilities: Enums<"availability">[] = ["available", "away", "offline"];

/** Approximate centre of a UK postcode district (e.g. "E2"), via postcodes.io. */
async function locateDistrict(district: string) {
  const outcode = district.trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z]{1,2}\d[A-Z\d]?$/.test(outcode)) return null;
  const res = await fetch(`https://api.postcodes.io/outcodes/${outcode}`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const { result } = (await res.json()) as { result?: { latitude: number; longitude: number } };
  return result ? { lat: result.latitude, lng: result.longitude } : null;
}

export async function saveListing(_: ListingFormState, form: FormData): Promise<ListingFormState> {
  const account = await requireAccount("/advertise");
  if (account.role !== "advertiser") return { error: "Only advertiser accounts can have a profile." };

  const district = String(form.get("district") ?? "");
  const pin = district ? await locateDistrict(district) : null;
  if (district && !pin) return { error: "We couldn't find that postcode district. Try something like E2 or LS1." };

  const availability = String(form.get("availability"));
  const fields = {
    slug: String(form.get("slug") ?? "").trim().toLowerCase(),
    display_name: String(form.get("display_name") ?? "").trim(),
    age: Number(form.get("age")),
    area: String(form.get("area") ?? "").trim(),
    bio: String(form.get("bio") ?? "").trim(),
    availability: availabilities.includes(availability as never) ? (availability as Enums<"availability">) : "offline",
    tags: String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((label) => ({ emoji: "✨", label: label.slice(0, 30) })),
    ...(pin ? { approx_lat: pin.lat, approx_lng: pin.lng } : {}),
  };

  const supabase = await createClient();
  const { data: existing } = await supabase.from("listings").select("id").eq("advertiser_id", account.id).maybeSingle();
  const { error } = existing
    ? await supabase.from("listings").update(fields).eq("id", existing.id)
    : await supabase.from("listings").insert(fields);

  if (error) {
    if (error.code === "23505") return { error: "That profile link is taken. Try another." };
    if (error.code === "23514") return { error: error.message.includes("Age") ? error.message : "Please check the fields and try again." };
    return { error: "Couldn't save your profile." };
  }
  revalidatePath("/advertise");
  return { saved: true };
}

export async function submitForReview() {
  await requireAccount("/advertise");
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_listing_for_review");
  revalidatePath("/advertise");
  if (error) return { error: error.message };
  return {};
}
