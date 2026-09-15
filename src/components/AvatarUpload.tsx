"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { prepareAvatar, ImageError } from "@/lib/image";
import { Avatar } from "@/components/ui/Avatar";

export function AvatarUpload({
  userId,
  name,
  initialUrl,
}: {
  userId: string;
  name: string;
  initialUrl: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [client] = useState(() => createClient());
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function handleFile(file: File) {
    setError(undefined);
    setBusy(true);

    try {
      const blob = await prepareAvatar(file);

      // Path is scoped to the user's own folder — the storage policy in
      // migration 0002 rejects anything else. The timestamp busts the CDN
      // cache, which would otherwise keep serving the old picture.
      const path = `${userId}/${Date.now()}.webp`;

      const { error: uploadError } = await client.storage
        .from("avatars")
        .upload(path, blob, { contentType: "image/webp", upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = client.storage.from("avatars").getPublicUrl(path);

      const { error: saveError } = await client
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (saveError) throw new Error(saveError.message);

      setUrl(publicUrl);
    } catch (e) {
      setError(
        e instanceof ImageError
          ? e.message
          : "That didn't upload. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={url} size="xl" />

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="text-[13px] font-bold text-you-500 hover:underline disabled:opacity-50"
        >
          {busy ? "Uploading…" : url ? "Change photo" : "Add a photo"}
        </button>

        <p className="mt-0.5 text-[11.5px] text-tx-lo">
          {error ?? "Helps people recognise you. Optional."}
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </div>
    </div>
  );
}
