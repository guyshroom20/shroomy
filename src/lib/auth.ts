import "server-only";
import { redirect } from "next/navigation";
import type { Tables } from "@/lib/supabase/database.types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type Account = Tables<"accounts">;

/** The signed-in user's account row, or null when signed out. */
export async function getAccount(): Promise<Account | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims.sub;
  if (!id) return null;
  const { data: account } = await supabase.from("accounts").select("*").eq("id", id).single();
  return account;
}

/** Like getAccount, but sends signed-out visitors to sign in and back again. */
export async function requireAccount(next: string): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return account;
}
