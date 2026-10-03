import { redirect } from "next/navigation";
import { signUp } from "@/app/actions";
import { AuthCard } from "@/components/AuthCard";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/session";

export default async function SignUp() {
  if (await getSession()) redirect("/dashboard");

  return (
    <AuthCard title="Create an account">
      <AuthForm
        action={signUp}
        submit="Sign up"
        fields={[
          { name: "name", label: "Name", type: "text", autoComplete: "name" },
          { name: "email", label: "Email", type: "email", autoComplete: "email" },
          { name: "password", label: "Password", type: "password", autoComplete: "new-password", minLength: 8 },
        ]}
        alt={{ text: "Already have an account?", label: "Sign in", href: "/sign-in" }}
      />
    </AuthCard>
  );
}
