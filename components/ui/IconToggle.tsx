import type { LucideIcon } from "lucide-react";

const TONE = {
  blue: "bg-blue text-white shadow-[0_4px_12px_-4px_var(--blue)]",
  orange: "bg-orange text-white shadow-[0_4px_12px_-4px_var(--orange)]",
  accent: "bg-accent text-on-accent shadow-[0_4px_12px_-4px_var(--accent)]",
};

/** Bottone tondo on/off con sola icona (macchina, extra). Target da 44pt. */
export function IconToggle({
  on,
  onChange,
  icon: Icon,
  label,
  tone = "accent",
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  icon: LucideIcon;
  label: string;
  tone?: keyof typeof TONE;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => onChange(!on)}
      className="glass-button -m-1 flex size-11 shrink-0 items-center justify-center rounded-full p-1"
    >
      <span className={`flex size-9 items-center justify-center rounded-full transition-colors duration-200 ${on ? TONE[tone] : "bg-fill text-label-2"}`}>
        <Icon className="size-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
    </button>
  );
}
