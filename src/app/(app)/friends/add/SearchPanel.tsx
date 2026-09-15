"use client";

import { useActionState } from "react";
import {
  searchByUsername,
  sendFriendRequest,
  type SearchState,
} from "@/app/friends/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { FormError } from "@/components/AuthShell";

export function SearchPanel() {
  const [state, action, pending] = useActionState<SearchState, FormData>(
    searchByUsername,
    {},
  );

  return (
    <section className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-3">
        <Field
          label="Username"
          name="username"
          prefix="@"
          placeholder="theirusername"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          hint="You need their exact username — we don't list people."
          required
        />
        <FormError message={state.error} />
        <Button type="submit" full disabled={pending}>
          {pending ? "Looking…" : "Find them"}
        </Button>
      </form>

      {state.found && (
        <div className="flex items-center gap-3 rounded-[var(--r-md)] border border-ink-500 bg-ink-700 p-3.5">
          <Avatar
            name={state.found.display_name || state.found.username}
            src={state.found.avatar_url}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-tx-hi">
              {state.found.display_name || state.found.username}
            </p>
            <p className="truncate text-[12px] text-tx-lo">
              @{state.found.username}
            </p>
          </div>
          <form action={sendFriendRequest} className="shrink-0">
            <input type="hidden" name="target" value={state.found.id} />
            <Button type="submit" className="px-4 py-2 text-[12px]">
              Add
            </Button>
          </form>
        </div>
      )}

      {state.found === null && state.query && (
        <div className="rounded-[var(--r-md)] border border-ink-500 bg-ink-700 p-4 text-center">
          <p className="mb-1 text-[13px] font-bold text-tx-hi">
            No one here is @{state.query}
          </p>
          <p className="text-[12.5px] leading-relaxed text-tx-mid">
            Check the spelling, or send them your invite code instead — they
            probably aren&apos;t on MusiChat yet.
          </p>
        </div>
      )}
    </section>
  );
}
