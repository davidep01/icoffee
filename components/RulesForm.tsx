"use client";

import { CakeSlice, Car, Scale } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/Stepper";
import { BETA } from "@/lib/fairness";
import { decimal } from "@/lib/format";
import type { Fairness, Settings } from "@/lib/types";

const FAIRNESS: { value: Fairness; label: string; hint: string }[] = [
  { value: "fortuna", label: "Fortuna", hint: "Pura lotteria: lo storico non conta." },
  { value: "bassa", label: "Bassa", hint: "Lo storico pesa poco, conta molto la fortuna." },
  { value: "media", label: "Media", hint: "Equilibrio tra fortuna ed equità." },
  { value: "alta", label: "Alta", hint: "Quasi a turno: chi è in debito esce quasi sempre." },
];

const coffees = () => "caffè";

/** Le regole dell'algoritmo, usate nel wizard e nelle impostazioni. */
export function RulesForm({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const current = FAIRNESS.find((f) => f.value === settings.fairness)!;
  const row = "flex flex-col gap-3 rounded-2xl bg-fill p-4";
  return (
    <div className="flex flex-col gap-2.5">
      <div className={row}>
        <div className="flex items-start gap-3">
          <CakeSlice className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <div className="text-headline">Valore di un extra</div>
            <p className="text-footnote text-label-2">Dolce, amaro, cornetto… quanto pesa rispetto a un caffè.</p>
          </div>
        </div>
        <Stepper label="Valore extra" value={settings.extraValue} onChange={(extraValue) => onChange({ extraValue })} unit={coffees} />
      </div>

      <div className={row}>
        <div className="flex items-start gap-3">
          <Car className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <div className="text-headline">Bonus macchina</div>
            <p className="text-footnote text-label-2">Credito per chi guida, pagato dai passeggeri.</p>
          </div>
        </div>
        <Stepper label="Bonus macchina" value={settings.carBonus} onChange={(carBonus) => onChange({ carBonus })} unit={coffees} />
      </div>

      <div className={row}>
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <div className="text-headline">Equità</div>
            <p className="text-footnote text-label-2">
              {current.hint}
              {BETA[settings.fairness] > 0 && ` Ogni caffè di debito: probabilità ×${decimal(Math.round(Math.exp(BETA[settings.fairness]) * 10) / 10)}.`}
            </p>
          </div>
        </div>
        <SegmentedControl label="Equità" value={settings.fairness} onChange={(fairness) => onChange({ fairness })} options={FAIRNESS} />
      </div>
    </div>
  );
}
