"use client";

import { ArrowUp, ImagePlus } from "lucide-react";
import { useState } from "react";

type Props = { onSend: (text: string) => void; initial?: string };

export function Composer({ onSend, initial = "" }: Props) {
  const [text, setText] = useState(initial);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };
  return (
    <form onSubmit={submit} className="glass sticky bottom-0 z-20 flex items-end gap-2 px-4 pt-3 pb-safe">
      <button type="button" aria-label="Attach photo" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted">
        <ImagePlus className="size-5" />
      </button>
      <div className="flex flex-1 items-end rounded-[26px] bg-surface-2 py-1.5 pl-4 pr-1.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="Message…"
          aria-label="Message"
          className="max-h-32 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[15px] placeholder:text-fg-subtle focus:outline-none [field-sizing:content]"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!text.trim()}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition disabled:opacity-40"
        >
          <ArrowUp className="size-5" />
        </button>
      </div>
    </form>
  );
}
