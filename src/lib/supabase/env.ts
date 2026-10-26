// Public Supabase settings. Until they're set the app keeps running on mock
// data, so the UI can be worked on without a backend.

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const PHOTO_BUCKET = "listing-photos";
