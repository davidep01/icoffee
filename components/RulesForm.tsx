"use client";

import { CakeSlice, Car, Scale } from "lucide-react";
import { IconTile, ListRow, ListSection } from "@/components/ui/List";
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

/** Le regole dell'algoritmo, nel wizard e in Regole. */
export function RulesForm({ settings, onChange }: { settings: Settings; onChange: (patch: Partial<Settings>) => void }) {
  const current = FAIRNESS.find((f) => f.value === settings.fairness)!;
  const factor = Math.exp(BETA[settings.fairness]);

  return (
    <>
      <ListSection header="Pesi" footer="L'extra pesa su chi lo prende. Il credito della macchina lo pagano i passeggeri.">
        <ListRow
          leading={<IconTile icon={CakeSlice} color="#FF9500" />}
          title="Extra"
          trailing={<Stepper label="Valore di un extra" unit="caffè" value={settings.extraValue} onChange={(extraValue) => onChange({ extraValue })} />}
        />
        <ListRow
          leading={<IconTile icon={Car} color="#007AFF" />}
          title="Macchina"
          trailing={<Stepper label="Bonus macchina" unit="caffè" value={settings.carBonus} onChange={(carBonus) => onChange({ carBonus })} />}
        />
      </ListSection>

      <ListSection
        header="Equità"
        footer={
          <>
            {current.hint}
            {factor > 1 && (
              <>
                {" "}
                Ogni caffè di debito moltiplica la probabilità per <b className="font-rounded text-label">×{decimal(Math.round(factor * 10) / 10)}</b>.
              </>
            )}
          </>
        }
      >
        <ListRow leading={<IconTile icon={Scale} color="#8A4A1F" />} title="Quanto conta lo storico">
          <div className="px-4 pb-4">
            <SegmentedControl label="Equità" value={settings.fairness} onChange={(fairness) => onChange({ fairness })} options={FAIRNESS} />
          </div>
        </ListRow>
      </ListSection>
    </>
  );
}
