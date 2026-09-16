import type { SupabaseClient } from "@supabase/supabase-js";

export type UserSettings = {
  showPresence: boolean;
  showVibing: boolean;
  readReceipts: boolean;
  requestPolicy: "anyone" | "link_only";
};

export const DEFAULT_SETTINGS: UserSettings = {
  showPresence: true,
  showVibing: true,
  readReceipts: true,
  requestPolicy: "anyone",
};

export async function loadSettings(
  supabase: SupabaseClient,
): Promise<UserSettings> {
  const { data } = await supabase.rpc("my_settings");
  const row = (data as Record<string, unknown>[] | null)?.[0];
  if (!row) return DEFAULT_SETTINGS;

  return {
    showPresence: Boolean(row.show_presence),
    showVibing: Boolean(row.show_vibing),
    readReceipts: Boolean(row.read_receipts),
    requestPolicy:
      row.request_policy === "link_only" ? "link_only" : "anyone",
  };
}
