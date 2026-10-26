import "server-only";
import * as mock from "@/lib/mock-data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/lib/types";
import { getProfileBySlug, getPublishedProfiles } from "./listings";

// The screens read profiles from here. Real listings once Supabase is
// configured, the mock data before then.

export async function getProfiles(): Promise<Profile[]> {
  return isSupabaseConfigured ? getPublishedProfiles() : mock.profiles;
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  if (!isSupabaseConfigured) return mock.getProfile(id);
  return (await getProfileBySlug(id))?.profile;
}
