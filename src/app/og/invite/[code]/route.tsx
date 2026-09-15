import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

/**
 * The Open Graph card for an invite link.
 *
 * This is the first thing anyone ever sees of MusiChat — it is what renders
 * inside WhatsApp before they decide whether to tap. A personal card with the
 * inviter's face converts on a different scale to a generic logo, which is why
 * it is generated per invite rather than shipped as a static image.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type Peek = {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  // Anon client: peek_invite is the one function granted to anon, and this
  // route runs with no session at all.
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await db.rpc("peek_invite", { invite_code: code });
  const invite = (data as Peek[])?.[0];
  const name = invite?.display_name?.trim() || invite?.username || "Someone";
  const initial = name.charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#141128",
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(59,141,255,0.35), transparent 45%), radial-gradient(circle at 82% 78%, rgba(255,79,151,0.35), transparent 45%)",
          fontFamily: "sans-serif",
        }}
      >
        {invite?.avatar_url ? (
          // next/image cannot be used here: ImageResponse renders through
          // satori, which only understands plain elements.
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img
            src={invite.avatar_url}
            width={168}
            height={168}
            style={{
              borderRadius: 168,
              objectFit: "cover",
              border: "6px solid rgba(255,255,255,0.14)",
            }}
          />
        ) : (
          <div
            style={{
              width: 168,
              height: 168,
              borderRadius: 168,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: "linear-gradient(135deg, #A24DEE, #FF4F97)",
              color: "white",
              fontSize: 76,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
        )}

        <div
          style={{
            marginTop: 44,
            fontSize: 62,
            fontWeight: 700,
            color: "#F2EFFB",
            letterSpacing: "-0.02em",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {name} wants to vibe with you
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            color: "#ADA5C8",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Chat and hear the same song at the same moment
        </div>

        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 6,
              borderRadius: 6,
              backgroundImage:
                "linear-gradient(100deg, #3B8DFF, #A24DEE, #FF4F97, #FF8A45)",
            }}
          />
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F2EFFB" }}>
            MusiChat
          </div>
        </div>
      </div>
    ),
    size,
  );
}
