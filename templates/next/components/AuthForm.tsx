"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/actions";

type Field = { name: string; label: string; type: string; autoComplete: string; minLength?: number };

type Props = {
  action: (state: AuthState, form: FormData) => Promise<AuthState>;
  fields: Field[];
  submit: string;
  alt: { text: string; label: string; href: string };
};

export function AuthForm({ action, fields, submit, alt }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-2 text-sm">
          <span className="text-muted">{f.label}</span>
          <input
            name={f.name}
            type={f.type}
            autoComplete={f.autoComplete}
            minLength={f.minLength}
            defaultValue={state.values?.[f.name]}
            required
            className="rounded-md border border-line bg-bg px-3 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-lav"
          />
        </label>
      ))}

      <p aria-live="polite" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-lav px-4 py-2.5 text-sm font-medium text-bg transition-colors hover:bg-lav-deep disabled:opacity-60"
      >
        {pending ? "…" : submit}
      </button>

      <p className="text-center text-sm text-muted">
        {alt.text}{" "}
        <Link href={alt.href} className="text-lav underline-offset-4 hover:underline">
          {alt.label}
        </Link>
      </p>
    </form>
  );
}
