import { Elephant } from "./Elephant";
import { Search } from "./Search";
import { ThemeToggle } from "./ThemeToggle";
import { site } from "@/lib/site";

const LINKS = [
  { label: "home", href: "#top" },
  { label: "stack", href: "#stack" },
  { label: "code", href: "#code" },
  { label: "github", href: site.links.github, external: true },
  { label: "npm", href: site.links.npm, external: true },
];

export function Nav() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center gap-3 px-4 py-6 sm:gap-4 sm:px-8 lg:px-12">
      <a href="#top" className="flex items-center" aria-label="donta home">
        <Elephant animated={false} className="h-8 w-auto" title="donta" />
      </a>
      <span className="hidden h-7 w-px shrink-0 bg-ink/70 md:block" aria-hidden="true" />
      <nav aria-label="Main" className="hidden min-w-0 flex-wrap gap-x-5 gap-y-1 text-sm md:flex lg:gap-x-6">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(l.external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="text-ink/90 underline-offset-4 transition-colors hover:text-lav hover:underline"
          >
            {l.label}
          </a>
        ))}
        <span className="text-muted" title="Coming soon">
          docs<sup className="ml-0.5 text-[9px] text-lav">soon</sup>
        </span>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Search />
        <ThemeToggle />
      </div>
    </header>
  );
}
