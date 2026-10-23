import { Minus, Plus } from "lucide-react";
import { decimal } from "@/lib/format";

/** UIStepper: valore a sinistra, capsula − | + a destra. */
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
  unit: string;
  label: string;
}) {
  const btn = "flex h-8 w-[46px] items-center justify-center text-label transition-colors active:bg-pressed disabled:text-label-3";
  return (
    <div className="flex shrink-0 items-center gap-3" role="group" aria-label={label}>
      <span className="font-rounded text-body text-label-2" aria-live="polite">
        {decimal(value)} {unit}
      </span>
      <div className="flex items-center overflow-hidden rounded-[9px] bg-fill">
        <button type="button" className={btn} aria-label={`${label}: meno`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
          <Minus className="size-[18px]" strokeWidth={2.4} />
        </button>
        <span className="h-[18px] w-px bg-separator" aria-hidden />
        <button type="button" className={btn} aria-label={`${label}: più`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
          <Plus className="size-[18px]" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
