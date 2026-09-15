"use client";

import { useActionState } from "react";
import { signUp, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormError } from "@/components/AuthShell";

export function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUp,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        minLength={8}
        required
      />

      <FormError message={state.error} />

      <Button type="submit" full disabled={pending} className="mt-1">
        {pending ? "Creating your account…" : "Continue"}
      </Button>
    </form>
  );
}
