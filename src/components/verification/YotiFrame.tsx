"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const YOTI_ORIGIN = "https://api.yoti.com";

/**
 * Yoti's capture flow. It posts SUCCESS or ERROR to this window when the
 * person finishes; we then fetch the result on the server.
 */
export function YotiFrame({ src, doneUrl, backUrl }: { src: string; doneUrl: string; backUrl: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== YOTI_ORIGIN) return;
      const type = (event.data as { eventType?: string } | null)?.eventType;
      if (type === "SUCCESS") window.location.assign(doneUrl);
      if (type === "ERROR") setFailed(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [doneUrl]);

  if (failed) {
    return (
      <div className="px-5 pt-10">
        <h1 className="text-[34px] font-medium leading-[1.05] tracking-[-0.04em]">The check didn&apos;t finish</h1>
        <p className="mt-3 text-[15px] text-fg-muted">
          That can happen if the camera was blocked or the session timed out. You can start again whenever you&apos;re ready.
        </p>
        <Link href={backUrl} className="mt-8 block w-full rounded-full bg-accent py-4 text-center text-[16px] font-medium text-accent-fg">
          Back
        </Link>
      </div>
    );
  }

  return <iframe src={src} allow="camera" title="ID verification" className="h-dvh w-full border-0" />;
}
