import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { mark: 24, text: "text-[17px]" },
  md: { mark: 30, text: "text-[20px]" },
  lg: { mark: 38, text: "text-[25px]" },
} as const;

/**
 * The mark plus the wordmark.
 *
 * "Chat" carries the ring gradient and "Musi" stays solid, matching the
 * supplied logo — the brand asset's own navy "Musi" would vanish on this
 * ground (DESIGN.md §4), so the type is set rather than used as an image.
 */
export function Wordmark({
  href = "/",
  size = "md",
  className,
}: {
  href?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];

  const content = (
    <>
      <Image
        src="/brand/icon-transparent.png"
        alt=""
        width={s.mark}
        height={s.mark}
        priority
        style={{ width: s.mark, height: s.mark }}
      />
      <span
        className={cn(
          "font-display font-bold tracking-tight text-tx-hi",
          s.text,
        )}
      >
        Musi
        <span className="bg-[image:var(--together)] bg-clip-text text-transparent">
          Chat
        </span>
      </span>
    </>
  );

  const classes = cn("inline-flex items-center gap-2", className);

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes} aria-label="MusiChat home">
      {content}
    </Link>
  );
}
