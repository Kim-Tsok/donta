"use client";

import { useEffect, useState } from "react";
import { SHOW_CODE_EVENT, type ShowCode } from "./Search";

export type RenderedFramework = {
  id: string;
  name: string;
  files: { file: string; html: string }[];
};

export function CodeTabs({ frameworks }: { frameworks: RenderedFramework[] }) {
  const [fw, setFw] = useState(0);
  const [file, setFile] = useState(0);
  // Search can jump straight to a file.
  useEffect(() => {
    function on(e: Event) {
      const { framework, file } = (e as CustomEvent<ShowCode>).detail;
      const i = frameworks.findIndex((f) => f.id === framework);
      if (i >= 0) {
        setFw(i);
        setFile(file);
      }
    }
    window.addEventListener(SHOW_CODE_EVENT, on);
    return () => window.removeEventListener(SHOW_CODE_EVENT, on);
  }, [frameworks]);

  const current = frameworks[fw];
  const active = current.files[Math.min(file, current.files.length - 1)];

  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-line p-2" role="tablist" aria-label="Framework">
        {frameworks.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={i === fw}
            onClick={() => {
              setFw(i);
              setFile(0);
            }}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${i === fw ? "bg-lav text-bg" : "text-muted hover:text-ink"}`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <div className="flex overflow-x-auto border-b border-line text-xs" role="tablist" aria-label="File">
        {current.files.map((f, i) => (
          <button
            key={f.file}
            type="button"
            role="tab"
            aria-selected={i === file}
            onClick={() => setFile(i)}
            className={`shrink-0 border-r border-line px-4 py-2.5 transition-colors ${i === file ? "bg-bg text-lav" : "text-muted hover:text-ink"}`}
          >
            {f.file}
          </button>
        ))}
      </div>
      {/* key forces a remount so the line-by-line reveal replays on switch */}
      <div
        key={`${current.id}/${active.file}`}
        role="tabpanel"
        className="code-block min-h-[17rem] bg-bg"
        dangerouslySetInnerHTML={{ __html: active.html }}
      />
    </div>
  );
}
