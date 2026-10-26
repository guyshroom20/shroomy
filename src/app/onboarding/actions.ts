"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { normalisePhone, recordDevice, recordSignal } from "@/lib/onboarding/signals";
import { createClient } from "@/lib/supabase/server";

export type StepState = { error?: string; saved?: boolean };

const othersInvolved = ["no", "yes", "prefer_not_to_say"];
const freeToStop = ["yes", "no", "not_sure"];

async function advertiser() {
  const account = await requireAccount("/onboarding");
  if (account.role !== "advertiser") throw new Error("Onboarding is for advertiser accounts");
  return account;
}

export async function giveConsents(_: StepState, form: FormData): Promise<StepState> {
  const account = await advertiser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("give_consents", { p_keys: form.getAll("statement").map(String) });
  if (error) return { error: error.message };
  await recordDevice(account.id);
  revalidatePath("/onboarding");
  return { saved: true };
}

export async function savePhone(_: StepState, form: FormData): Promise<StepState> {
  const account = await advertiser();
  const phone = normalisePhone(String(form.get("phone") ?? ""));
  if (!phone) return { error: "That doesn't look like a phone number. Try something like 07700 900123." };
  // Only a keyed hash is kept, never the number itself.
  await recordSignal(account.id, "phone", phone);
  await recordDevice(account.id);
  revalidatePath("/onboarding");
  return { saved: true };
}

export async function submitCheckin(_: StepState, form: FormData): Promise<StepState> {
  const account = await advertiser();
  const others = String(form.get("others_involved"));
  const free = String(form.get("free_to_stop"));
  if (!othersInvolved.includes(others) || !freeToStop.includes(free)) return { error: "Please answer both questions." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_safety_checkin", {
    p_others_involved: others,
    p_free_to_stop: free,
    p_wants_contact: form.get("wants_contact") === "on",
  });
  if (error) return { error: error.message };
  await recordDevice(account.id);
  revalidatePath("/onboarding");
  return { saved: true };
}

export async function sendForReview(): Promise<StepState> {
  const account = await advertiser();
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_listing_for_review");
  if (error) return { error: error.message };
  await recordDevice(account.id);
  revalidatePath("/onboarding");
  revalidatePath("/advertise");
  return { saved: true };
}
