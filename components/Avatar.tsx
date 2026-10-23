import type { Friend } from "@/lib/types";

/** Monogramma su sfondo colorato, con una leggera luce come gli avatar di Contatti. */
export function Avatar({ friend, size = 36, className = "" }: { friend: Pick<Friend, "name" | "color">; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(180deg, color-mix(in srgb, ${friend.color} 78%, white) 0%, ${friend.color} 100%)`,
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.3)",
      }}
    >
      {friend.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
