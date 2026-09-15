"use client";

import { useActionState, useEffect, useState } from "react";
import { claimUsername } from "@/app/onboarding/actions";
import { USERNAME_PATTERN } from "@/app/onboarding/constants";
import type { FormState } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormError } from "@/components/AuthShell";

const DEBOUNCE_MS = 400;

type Answer = { name: string; free: boolean };

export function UsernameForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    claimUsername,
    {},
  );

  const [value, setValue] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [client] = useState(() => createClient());

  const candidate = value.trim().toLowerCase();
  const formatValid = USERNAME_PATTERN.test(candidate);

  useEffect(() => {
    if (!formatValid) return;

    let cancelled = false;
    // Debounced so typing doesn't fire a query per keystroke. The state
    // update happens inside the callback, never synchronously in the effect.
    const timer = setTimeout(async () => {
      const { data, error } = await client.rpc("is_username_available", {
        candidate,
      });
      if (cancelled || error) return;
      setAnswer({ name: candidate, free: Boolean(data) });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [candidate, formatValid, client]);

  // Derived during render rather than stored, so it can never disagree with
  // what is currently typed. A stale "available" would let the user submit a
  // name that is already gone.
  const answered = answer?.name === candidate;
  const status = !candidate
    ? "idle"
    : !formatValid
      ? "invalid"
      : !answered
        ? "checking"
        : answer!.free
          ? "free"
          : "taken";

  const rule = "3–20 characters. Letters, numbers and underscores.";

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <Field
          label="Username"
          name="username"
          prefix="@"
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase())}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          required
          hint={status === "checking" ? "Checking…" : rule}
          error={status === "taken" ? `@${candidate} is taken` : undefined}
        />

        {status === "free" && (
          <p className="mt-1.5 text-[11.5px] font-bold text-online">
            @{candidate} is available
          </p>
        )}
      </div>

      <FormError message={state.error} />

      <Button type="submit" full disabled={pending || status !== "free"}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
