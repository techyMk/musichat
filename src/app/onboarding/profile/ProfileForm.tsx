"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveProfile } from "@/app/onboarding/actions";
import {
  GENRES,
  MAX_GENRES,
  BIO_LIMIT,
  DISPLAY_NAME_LIMIT,
} from "@/app/onboarding/constants";
import type { FormState } from "@/app/auth/actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { FormError } from "@/components/AuthShell";

export function ProfileForm({
  username,
  displayName,
  bio,
  genres,
}: {
  username: string;
  displayName: string;
  bio: string;
  genres: string[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveProfile,
    {},
  );

  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [selected, setSelected] = useState<string[]>(genres);

  const toggle = (genre: string) =>
    setSelected((current) =>
      current.includes(genre)
        ? current.filter((g) => g !== genre)
        : current.length >= MAX_GENRES
          ? current
          : [...current, genre],
    );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <Avatar name={name || username} size="xl" />
        <div>
          <p className="text-[13px] font-bold text-tx-hi">Your photo</p>
          <p className="text-[11.5px] text-tx-lo">
            Arriving in the next step of the build.
          </p>
        </div>
      </div>

      <Field
        label="Display name"
        name="display_name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={username}
        maxLength={DISPLAY_NAME_LIMIT}
        autoComplete="name"
      />

      <Field
        label="Bio"
        name="bio"
        value={bioText}
        onChange={(e) => setBioText(e.target.value)}
        placeholder="Something short"
        maxLength={BIO_LIMIT}
        hint={`${bioText.length}/${BIO_LIMIT}`}
      />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-[11px] font-bold text-tx-mid">
          What do you listen to?
        </legend>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => (
            <Chip
              key={genre}
              selected={selected.includes(genre)}
              onClick={() => toggle(genre)}
            >
              {genre}
            </Chip>
          ))}
        </div>
        {selected.map((genre) => (
          <input key={genre} type="hidden" name="genres" value={genre} />
        ))}
      </fieldset>

      <FormError message={state.error} />

      <div className="flex flex-col gap-1">
        <Button type="submit" full disabled={pending}>
          {pending ? "Saving…" : "Done"}
        </Button>
        {/* Never styled as a button — skipping has to feel free. */}
        <Link
          href="/chats"
          className="py-3 text-center text-[13px] text-tx-lo hover:text-tx-mid"
        >
          Skip for now
        </Link>
      </div>
    </form>
  );
}
