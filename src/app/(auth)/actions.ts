"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; sent?: boolean };

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "That email and password don't match." };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  if (form.get("adult") !== "on") return { error: "You must be 18 or over to use shroom." };
  const role = form.get("role") === "advertiser" ? "advertiser" : "visitor";
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters for your password." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? ""),
    password,
    options: {
      data: { role, display_name: String(form.get("display_name") ?? "").trim() },
      emailRedirectTo: `${origin}/auth/confirm?next=${role === "advertiser" ? "/advertise" : "/"}`,
    },
  });
  if (error) return { error: error.message };
  return { sent: true };
}
