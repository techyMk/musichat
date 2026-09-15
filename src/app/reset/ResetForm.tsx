"use client";

import { useActionState } from "react";
import { updatePassword, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormError } from "@/components/AuthShell";

export function ResetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    updatePassword,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters"
        minLength={8}
        required
      />

      <Field
        label="Confirm it"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <FormError message={state.error} />

      <Button type="submit" full disabled={pending} className="mt-1">
        {pending ? "Saving…" : "Save password"}
      </Button>
    </form>
  );
}
