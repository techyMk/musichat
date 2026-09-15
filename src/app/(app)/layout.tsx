import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { loadFriendships } from "@/lib/friends";
import { FriendsList } from "@/components/FriendsList";
import { AppNav, LegalLinks } from "@/components/AppNav";
import { Wordmark } from "@/components/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { FullPlayer } from "@/components/player/FullPlayer";

/**
 * Chrome for every signed-in screen.
 *
 * Desktop is a single elevated window: a persistent rail beside the active
 * pane. Below lg the rail is hidden and each route is a full screen with its
 * own back affordance — the phone model from UX.md §3.
 *
 * The rail lives here rather than in a page so it survives navigation without
 * remounting. M5 depends on that: a session has to keep playing while you move
 * between conversations.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/username");

  const friendships = await loadFriendships(user.id);
  const friends = friendships.filter((f) => f.status === "accepted");
  const pending = friendships.filter((f) => f.status === "pending" && f.incoming);
  const myName = profile.display_name || profile.username;

  return (
    <PlayerProvider>
      <div className="flex w-full flex-1 lg:justify-center lg:p-6">
        <div
          className={[
            "flex w-full flex-1 overflow-hidden",
            // The window: one surface, one border, one shadow — rather than
            // separate panels that read as unrelated boxes.
            "lg:max-w-6xl lg:rounded-[var(--r-xl)] lg:border lg:border-ink-600",
            "lg:bg-ink-800/80 lg:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] lg:backdrop-blur-xl",
          ].join(" ")}
        >
        <aside className="hidden w-[320px] shrink-0 flex-col border-r border-ink-600 bg-ink-900/50 lg:flex">
          <header className="flex items-center gap-2 px-4 py-4">
            <Wordmark href="/dashboard" size="sm" className="flex-1" />
            <ThemeToggle />
          </header>

          <div className="px-2">
            <AppNav pendingCount={pending.length} />
          </div>

          <div className="px-4 pt-5 pb-2">
            <p className="text-[10px] font-bold tracking-[0.14em] text-tx-lo uppercase">
              Conversations
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2">
            {friends.length > 0 ? (
              <FriendsList friends={friends} />
            ) : (
              <p className="px-3 py-3 text-[12.5px] leading-relaxed text-tx-lo">
                No one here yet. Share your invite code and this fills up.
              </p>
            )}
          </div>

          <div className="border-t border-ink-600 p-2">
            <Link
              href="/me"
              className="flex items-center gap-2.5 rounded-[var(--r-md)] px-2.5 py-2.5 transition-colors duration-[var(--dur-fast)] hover:bg-ink-700"
            >
              <Avatar name={myName} src={profile.avatar_url} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold text-tx-hi">
                  {myName}
                </span>
                <span className="block truncate text-[11.5px] text-tx-lo">
                  @{profile.username}
                </span>
              </span>
            </Link>
            <div className="px-2.5 pt-2 pb-1">
              <LegalLinks />
            </div>
          </div>
        </aside>

          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      </div>

      {/* Mounted in the layout, not a page, so audio survives navigation. */}
      <MiniPlayer />
      <FullPlayer />
    </PlayerProvider>
  );
}
