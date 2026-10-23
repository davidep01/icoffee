import type { LucideIcon } from "lucide-react";

/** Pillola on/off con icona: per macchina ed extra. */
export function Toggle({
  on,
  onChange,
  icon: Icon,
  label,
  disabled,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`glass-button inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-footnote font-semibold disabled:opacity-40 ${
        on ? "bg-accent text-on-accent" : "bg-fill text-label-2"
      }`}
    >
      <Icon className="size-4" strokeWidth={2.2} aria-hidden />
      {label}
    </button>
  );
}
