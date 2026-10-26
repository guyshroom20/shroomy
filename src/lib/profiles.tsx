"use client";

import { createContext, useContext } from "react";
import type { Profile } from "./types";

// Profiles loaded on the server, shared with client screens (Explore, Saved, filters).

const Ctx = createContext<Profile[]>([]);

export function ProfilesProvider({ profiles, children }: { profiles: Profile[]; children: React.ReactNode }) {
  return <Ctx.Provider value={profiles}>{children}</Ctx.Provider>;
}

export const useProfiles = () => useContext(Ctx);
