"use client";

import { useState } from "react";
import { site } from "@/lib/site";

export function InstallCommand({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(site.install);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (insecure context, permissions); nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`group inline-flex items-center gap-3 rounded-md border border-line bg-surface/80 px-4 py-3 text-sm backdrop-blur transition-colors hover:border-lav/60 ${className}`}
      aria-label={`Copy install command: ${site.install}`}
    >
      <span className="text-muted">$</span>
      <span className="text-ink">{site.install}</span>
      <span
        className={`ml-2 w-14 text-right text-xs transition-colors ${copied ? "text-mint" : "text-muted group-hover:text-lav"}`}
        aria-live="polite"
      >
        {copied ? "copied" : "copy"}
      </span>
    </button>
  );
}
