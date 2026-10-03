"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AuthState = { error?: string; values?: Record<string, string> };

function field(form: FormData, name: string) {
  return String(form.get(name) ?? "").trim();
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const name = field(form, "name");
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");

  try {
    await auth.api.signUpEmail({ body: { name, email, password }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: error.message, values: { name, email } };
    throw error;
  }
  redirect("/dashboard");
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, "email");
  const password = String(form.get("password") ?? "");

  try {
    await auth.api.signInEmail({ body: { email, password }, headers: await headers() });
  } catch (error) {
    if (error instanceof APIError) return { error: error.message, values: { email } };
    throw error;
  }
  redirect("/dashboard");
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
