"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { Conversation, Profile } from "@/lib/types";
import { ConversationRow } from "./ConversationRow";

type Item = { conversation: Conversation; profile: Profile };

/** Search box and conversation list. Matches names and message text. */
export function InboxList({ items, children }: { items: Item[]; children?: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const results = q
    ? items.filter(
        ({ conversation, profile }) =>
          profile.displayName.toLowerCase().includes(q) || conversation.messages.some((m) => m.text.toLowerCase().includes(q)),
      )
    : items;

  return (
    <>
      <div className="px-5">
        <label className="mt-4 flex items-center gap-2 rounded-full bg-surface px-4 py-3 text-fg-muted">
          <Search className="size-4" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search messages"
            className="flex-1 bg-transparent text-[15px] text-fg placeholder:text-fg-subtle focus:outline-none"
          />
        </label>
      </div>

      {/* Stories rail is hidden while searching. */}
      {!q && children}

      <ul className="mt-4 px-3">
        {results.map(({ conversation, profile }) => (
          <li key={conversation.id}>
            <ConversationRow conversation={conversation} profile={profile} />
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="mt-6 text-center text-[14px] text-fg-muted">No conversations match “{query}”</p>}
    </>
  );
}
