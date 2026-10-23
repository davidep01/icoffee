import { Minus, Plus } from "lucide-react";
import { decimal } from "@/lib/format";

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 3,
  step = 0.5,
  unit,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit: (v: number) => string;
  label: string;
}) {
  const btn = "glass-button flex size-9 items-center justify-center rounded-full bg-fill text-label disabled:opacity-35";
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={btn} aria-label="Meno" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        <Minus className="size-4" strokeWidth={2.4} />
      </button>
      <span className="min-w-[78px] text-center text-subhead font-semibold tabular-nums">
        {decimal(value)} {unit(value)}
      </span>
      <button type="button" className={btn} aria-label="Più" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        <Plus className="size-4" strokeWidth={2.4} />
      </button>
    </div>
  );
}
