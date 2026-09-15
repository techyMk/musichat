import { cn } from "@/lib/cn";

/**
 * DESIGN.md §5.2.
 *
 * The vibing ring is the most important glanceable element in the app — it is
 * what makes someone tap. It is the only continuously rotating thing in the
 * product, and it supersedes the online dot: they never appear together.
 */

const SIZES = {
  sm: { box: "h-7 w-7", text: "text-[11px]", dot: "h-2 w-2" },
  md: { box: "h-[34px] w-[34px]", text: "text-[12px]", dot: "h-2.5 w-2.5" },
  lg: { box: "h-10 w-10", text: "text-[13px]", dot: "h-[11px] w-[11px]" },
  xl: { box: "h-16 w-16", text: "text-[20px]", dot: "h-3 w-3" },
  xxl: { box: "h-[76px] w-[76px]", text: "text-[24px]", dot: "h-3.5 w-3.5" },
} as const;

/** Brand-derived gradients. Avatars don't carry the you/them signal — bubble
 *  alignment and colour do — so these are free to vary per person. */
const GRADIENTS = [
  "linear-gradient(145deg,#FF83B6,#E02B78)",
  "linear-gradient(145deg,#6FA8FF,#2168E0)",
  "linear-gradient(145deg,#C07CF0,#8B3BE0)",
  "linear-gradient(145deg,#FFB07A,#FF7A2F)",
  "linear-gradient(145deg,#A24DEE,#FF4F97)",
  "linear-gradient(145deg,#7FD8FF,#3B8DFF)",
];

/** Same name always gets the same colour, on every device. */
function gradientFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  /** In a live shared session — shows the rotating ring. */
  vibing?: boolean;
  /** Online. Ignored when vibing, which supersedes it. */
  online?: boolean;
  className?: string;
};

export function Avatar({
  name,
  src,
  size = "lg",
  vibing = false,
  online = false,
  className,
}: AvatarProps) {
  const s = SIZES[size];

  const face = (
    <span
      className={cn(
        "relative grid place-items-center overflow-hidden rounded-full font-bold text-white",
        s.box,
        s.text,
      )}
      style={src ? undefined : { backgroundImage: gradientFor(name) }}
    >
      {src ? (
        // Avatars are downsized client-side before upload (PRD FR-P3), so
        // next/image optimisation would add cost for no benefit here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
    >
      {vibing && (
        <span
          aria-hidden="true"
          className="motion-safe:animate-[spin_4.5s_linear_infinite] absolute -inset-1 rounded-full bg-[conic-gradient(from_0deg,#3B8DFF,#A24DEE,#FF4F97,#FF8A45,#A24DEE,#3B8DFF)]"
        />
      )}
      {vibing && (
        <span
          aria-hidden="true"
          className="absolute -inset-[1.5px] rounded-full bg-ink-800"
        />
      )}

      <span className="relative">{face}</span>

      {!vibing && online && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full border-[2.5px] border-ink-800 bg-online",
            s.dot,
          )}
        >
          <span className="sr-only">Online</span>
        </span>
      )}
    </span>
  );
}
