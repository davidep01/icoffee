import type { LucideIcon } from "lucide-react";

type Tone = "neutral" | "accent" | "green" | "red" | "blue" | "yellow";

const TONE: Record<Tone, string> = {
  neutral: "bg-fill text-label-2",
  accent: "bg-accent-soft text-accent",
  green: "bg-green-soft text-green",
  red: "bg-red-soft text-red",
  blue: "bg-blue-soft text-blue",
  yellow: "bg-yellow-soft text-yellow",
};

export function Chip({
  children,
  tone = "neutral",
  icon: Icon,
  className = "",
}: {
  children: React.ReactNode;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-footnote font-semibold ${TONE[tone]} ${className}`}
    >
      {Icon && <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />}
      {children}
    </span>
  );
}
