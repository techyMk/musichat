"use client";

import { useActionState } from "react";
import { signIn, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormError } from "@/components/AuthShell";

export function LoginForm({
  next,
  linkError,
}: {
  next: string;
  linkError?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <input type="hidden" name="next" value={next} />

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
        autoComplete="current-password"
        required
      />

      <FormError message={state.error ?? linkError} />

      <Button type="submit" full disabled={pending} className="mt-1">
        {pending ? "Logging you in…" : "Log in"}
      </Button>
    </form>
  );
}
