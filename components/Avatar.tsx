import type { Friend } from "@/lib/types";

export function Avatar({ friend, size = 36 }: { friend: Pick<Friend, "name" | "color">; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
      style={{ width: size, height: size, background: friend.color, fontSize: size * 0.42 }}
    >
      {friend.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
