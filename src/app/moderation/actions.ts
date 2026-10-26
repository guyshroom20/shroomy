"use server";

import { revalidatePath } from "next/cache";
import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// Every action goes through a database function that checks the caller is a
// moderator and writes to the moderation log, so these stay thin.

async function done(error: { message: string } | null) {
  if (error) throw new Error(error.message);
  revalidatePath("/moderation");
}

export async function reviewPhoto(form: FormData) {
  const supabase = await createClient();
  const approve = form.get("decision") === "approve";
  const { error } = await supabase.rpc("review_photo", {
    p_photo_id: String(form.get("id")),
    p_approve: approve,
    p_reason: approve ? undefined : String(form.get("note") || "Doesn't meet photo rules"),
  });
  await done(error);
}

export async function reviewListing(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_listing", {
    p_listing_id: String(form.get("id")),
    p_approve: form.get("decision") === "approve",
    p_note: String(form.get("note") ?? "") || undefined,
  });
  await done(error);
}

export async function resolveReport(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("resolve_report", {
    p_report_id: Number(form.get("id")),
    p_status: form.get("decision") === "actioned" ? "actioned" : ("dismissed" as Enums<"report_status">),
    p_note: String(form.get("note") ?? "") || undefined,
  });
  await done(error);
}

export async function banAccount(form: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_account_ban", {
    p_account_id: String(form.get("id")),
    p_banned: true,
    p_reason: String(form.get("note") || "Breach of the rules"),
  });
  await done(error);
}
