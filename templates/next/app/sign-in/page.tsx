import { redirect } from "next/navigation";
import { signIn } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/session";

export default async function SignIn() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthCard title="Sign in">
      <AuthForm
        action={signIn}
        submit="Sign in"
        fields={[
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
        ]}
        alt={{ text: "No account yet?", label: "Sign up", href: "/sign-up" }}
      />
    </AuthCard>
  );
}
