"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendConfirmation, type FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/AuthShell";

/**
 * UX.md §6.1 — the holding screen needs both escapes. A typo'd email address
 * is otherwise a dead end that costs you the user permanently: they can't get
 * in, and they can't sign up again with the correct address either.
 */
export function VerifyPanel({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    resendConfirmation,
    {},
  );

  const sent = state.error === undefined && !pending;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] leading-relaxed text-tx-mid">
        Nothing arrived? It can take a minute, and it sometimes lands in spam.
      </p>

      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <FormError message={state.error} />
        <Button type="submit" variant="quiet" full disabled={pending || !email}>
          {pending ? "Sending…" : sent ? "Send it again" : "Resend the link"}
        </Button>
      </form>

      <p className="text-center text-[13px] text-tx-lo">
        Wrong address?{" "}
        <Link href="/signup" className="font-bold text-you-500 hover:underline">
          Sign up with a different one
        </Link>
      </p>
    </div>
  );
}
