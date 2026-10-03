import { Elephant } from "./Elephant";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-12">
        <div>
          <div className="flex items-center gap-3">
            <Elephant animated={false} className="h-8 w-auto" />
            <span className="font-display text-lg font-bold">DONTA</span>
          </div>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">
            The name comes from <span className="text-ink">Loxodonta</span>, the genus of the
            African elephant.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted">
          <a className="hover:text-lav" href={site.links.github} target="_blank" rel="noreferrer">github</a>
          <a className="hover:text-lav" href={site.links.npm} target="_blank" rel="noreferrer">npm</a>
          <span>MIT</span>
        </div>
      </div>
    </footer>
  );
}
