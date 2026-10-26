"use client";

import { useState } from "react";
import { useToast } from "@/lib/toast";
import { cn } from "@/lib/cn";
import { Sheet } from "./Sheet";

const reasons = ["Fake profile or photos", "Under 18", "Scam or asking for money", "Harassment", "Something else"];

type Props = { open: boolean; onClose: () => void; name: string };

/** Report flow. Logs locally until the moderation API exists. */
export function ReportSheet({ open, onClose, name }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const toast = useToast();
  const close = () => {
    setReason(null);
    onClose();
  };
  return (
    <Sheet open={open} onClose={close} title={`Report ${name}`}>
      <p className="text-[14px] text-fg-muted">{name} won&apos;t know you reported them.</p>
      <div className="mt-4 space-y-2">
        {reasons.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={reason === r}
            onClick={() => setReason(r)}
            className={cn("w-full rounded-2xl px-4 py-3.5 text-left text-[15px] transition", reason === r ? "bg-fg text-bg" : "bg-surface-2 hover:bg-surface-3")}
          >
            {r}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={!reason}
        onClick={() => {
          toast("Report sent. Thanks for keeping shroom safe.");
          close();
        }}
        className="mt-5 h-14 w-full rounded-full bg-red-500 text-[16px] font-medium text-white transition disabled:opacity-40"
      >
        Send report
      </button>
    </Sheet>
  );
}
