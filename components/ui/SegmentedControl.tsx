"use client";

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-[11px] bg-fill p-0.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            type="button"
            onClick={() => onChange(o.value)}
            className={`h-8 min-w-0 flex-1 whitespace-nowrap rounded-[9px] px-1.5 text-footnote font-semibold transition-all duration-200 sm:px-3 sm:text-subhead ${
              active ? "bg-[var(--glass-strong)] text-label shadow-[0_2px_8px_rgb(0_0_0/0.12)]" : "text-label-2"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
