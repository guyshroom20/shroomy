"use client";

import { ArrowUp, ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

type Props = { onSend: (message: { text: string; image?: string }) => void; initial?: string };

export function Composer({ onSend, initial = "" }: Props) {
  const [text, setText] = useState(initial);
  // Local object URL for the picked photo until uploads exist.
  const [image, setImage] = useState<string>();
  const file = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t && !image) return;
    onSend({ text: t, image });
    setText("");
    setImage(undefined);
  };

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setImage(URL.createObjectURL(f));
    e.target.value = "";
  };

  return (
    <form onSubmit={submit} className="glass sticky bottom-0 z-20 px-4 pt-3 pb-safe">
      {image && (
        <div className="relative mb-2 ml-14 size-20 overflow-hidden rounded-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Photo to send" className="h-full w-full object-cover" />
          <button
            type="button"
            aria-label="Remove photo"
            onClick={() => {
              URL.revokeObjectURL(image);
              setImage(undefined);
            }}
            className="glass absolute right-1 top-1 flex size-6 items-center justify-center rounded-full"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={file} type="file" accept="image/*" onChange={pick} className="hidden" />
        <button
          type="button"
          aria-label="Attach photo"
          onClick={() => file.current?.click()}
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-fg-muted hover:text-fg"
        >
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
            disabled={!text.trim() && !image}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-fg transition disabled:opacity-40"
          >
            <ArrowUp className="size-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
