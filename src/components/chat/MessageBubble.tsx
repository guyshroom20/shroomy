import { Check, CheckCheck } from "lucide-react";
import type { Message } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type Props = { message: Message; first: boolean; last: boolean };

/** One message. `first`/`last` mark its position in a run from the same sender. */
export function MessageBubble({ message, first, last }: Props) {
  const mine = message.fromMe;
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start", first ? "mt-3" : "mt-1")}>
      <p
        className={cn(
          "max-w-[78%] rounded-[22px] px-4 py-2.5 text-[15px] leading-snug",
          mine ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg",
          mine && !last && "rounded-br-md",
          mine && !first && "rounded-tr-md",
          !mine && !last && "rounded-bl-md",
          !mine && !first && "rounded-tl-md",
        )}
      >
        {message.text}
      </p>
      {last && (
        <span className="mt-1 flex items-center gap-1 px-2 text-[11px] text-fg-subtle">
          {formatTime(message.sentAt)}
          {mine && message.status === "read" && <CheckCheck className="size-3.5 text-verified" aria-label="Read" />}
          {mine && message.status === "delivered" && <CheckCheck className="size-3.5" aria-label="Delivered" />}
          {mine && message.status === "sent" && <Check className="size-3.5" aria-label="Sent" />}
        </span>
      )}
    </div>
  );
}
