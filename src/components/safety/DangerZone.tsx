"use client";

import { useActionState, useState } from "react";
import {
  unblockUser,
  deleteAccount,
  type ActionState,
} from "@/app/(app)/safety/actions";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";

export type BlockedUser = {
  blocked_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export function BlockedList({ blocked }: { blocked: BlockedUser[] }) {
  if (blocked.length === 0) {
    return (
      <p className="text-[13px] leading-relaxed text-tx-mid">
        You haven&apos;t blocked anyone.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {blocked.map((b) => (
        <li key={b.blocked_id} className="flex items-center gap-3">
          <Avatar
            name={b.display_name || b.username}
            src={b.avatar_url}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-bold text-tx-hi">
              {b.display_name || b.username}
            </p>
            <p className="truncate text-[11.5px] text-tx-lo">@{b.username}</p>
          </div>
          <form action={unblockUser}>
            <input type="hidden" name="target" value={b.blocked_id} />
            <Button
              type="submit"
              variant="ghost"
              className="px-4 py-2 text-[12px]"
            >
              Unblock
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}

/**
 * Account deletion (SEC-7).
 *
 * Behind a typed confirmation, and behind a disclosure of exactly what goes —
 * an irreversible action deserves to be understood before it is taken, not
 * after.
 */
export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    deleteAccount,
    {},
  );

  if (!open) {
    return (
      <Button variant="danger" full onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-[var(--r-md)] border border-[rgba(249,69,69,0.3)] bg-[rgba(249,69,69,0.06)] p-4"
    >
      <p className="text-[13.5px] font-bold text-tx-hi">
        This can&apos;t be undone
      </p>
      <ul className="flex flex-col gap-1 text-[12.5px] leading-relaxed text-tx-mid">
        <li>Your profile, messages and uploads are deleted.</li>
        <li>Your connections are removed for both sides.</li>
        <li>Your username is released and someone else may take it.</li>
      </ul>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] font-bold text-tx-mid">
          Type <span className="text-tx-hi">delete</span> to confirm
        </span>
        <input
          name="confirm"
          autoComplete="off"
          className="rounded-[var(--r-md)] border border-ink-500 bg-ink-700 px-3 py-2 text-[13.5px] text-tx-hi outline-none focus:border-danger"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-[12.5px] text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          full
          onClick={() => setOpen(false)}
        >
          Keep my account
        </Button>
        <Button type="submit" variant="danger" full disabled={pending}>
          {pending ? "Deleting…" : "Delete forever"}
        </Button>
      </div>
    </form>
  );
}
