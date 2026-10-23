/** Interruttore iOS. */
export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-40"
      style={{ background: on ? "var(--switch-on)" : "var(--fill-2)" }}
    >
      <span
        className="absolute left-[2px] top-[2px] size-[27px] rounded-full bg-white shadow-[0_3px_8px_rgb(0_0_0/0.15),0_1px_1px_rgb(0_0_0/0.16)] transition-transform duration-300"
        style={{ transform: on ? "translateX(20px)" : "none", transitionTimingFunction: "cubic-bezier(0.3, 1.4, 0.5, 1)" }}
      />
    </button>
  );
}
