import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabasePublishableKey, supabaseUrl } from "./env";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Supabase client for client components. One shared instance per tab. */
export function createClient() {
  client ??= createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
  return client;
}
