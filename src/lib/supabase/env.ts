// Public Supabase settings. Until they're set the app keeps running on mock
// data, so the UI can be worked on without a backend.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

// A half-filled .env.local (template placeholders still in it) counts as not configured.
const looksReal = (v: string) => Boolean(v) && !v.includes("<") && !v.endsWith("...");
export const isSupabaseConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl) && looksReal(supabasePublishableKey);

export const PHOTO_BUCKET = "listing-photos";
