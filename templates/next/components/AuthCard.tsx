import { Elephant } from "./Elephant";

export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm pt-12 sm:pt-20">
      <Elephant zzz className="h-12 w-auto" />
      <h1 className="mt-6 font-display text-2xl font-bold">{title}</h1>
      <div className="mt-8 rounded-lg border border-line bg-surface p-6">{children}</div>
    </div>
  );
}
