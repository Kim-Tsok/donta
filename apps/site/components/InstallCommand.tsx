"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

export function InstallCommand({ className = "", command = site.install }: { className?: string; command?: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => { setStatus("idle"); return () => clearTimeout(timer.current); }, [command]);

  async function copy() {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
      timer.current = setTimeout(() => setStatus("idle"), 1800);
    } catch { setStatus("error"); }
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <div className="flex min-w-0 items-center gap-3 rounded-md border border-line bg-bg/90 px-3 py-2 sm:px-4">
        <span className="select-none text-muted" aria-hidden="true">$</span>
        <code className="min-w-0 flex-1 break-all py-2 text-[13px] leading-6 text-ink sm:text-sm">{command}</code>
        <button type="button" onClick={copy} aria-label={`Copy command: ${command}`} className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded px-2 text-xs text-lav transition-colors hover:bg-lav/10">
          {status === "copied" ? "copied" : "copy"}
        </button>
      </div>
      <span role="status" className={status === "error" ? "mt-2 block text-xs text-muted" : "sr-only"}>
        {status === "copied" ? "Command copied to clipboard." : status === "error" ? "Clipboard unavailable. Select and copy the command above." : ""}
      </span>
    </div>
  );
}
