"use client";

import { useState } from "react";
import { CakeSlice, Car, Check, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { deleteSessionWithUndo } from "@/components/sessionActions";
import { Button } from "@/components/ui/Button";
import { IconToggle } from "@/components/ui/IconToggle";
import { ListRow, ListSection } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { clock, shortDate } from "@/lib/format";
import { toggleId } from "@/lib/list";
import { actions } from "@/lib/store";
import type { Session, State } from "@/lib/types";

/** Correggere un'estrazione: chi ha pagato, chi c'era, macchina ed extra. */
export function EditSessionSheet({ session, state, onClose }: { session: Session; state: State; onClose: () => void }) {
  const [draft, setDraft] = useState(session);
  const people = state.friends.filter((f) => f.active || session.present.includes(f.id) || session.payerId === f.id);
  const present = people.filter((f) => draft.present.includes(f.id));

  const setPresent = (id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      present: toggleId(d.present, id, on),
      drivers: on ? d.drivers : d.drivers.filter((x) => x !== id),
      extras: on ? d.extras : d.extras.filter((x) => x !== id),
    }));

  return (
    <Sheet
      onClose={onClose}
      title={`${shortDate(session.date)}, ${clock(session.date)}`}
      footer={
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="lg"
            icon={Trash2}
            aria-label="Elimina estrazione"
            onClick={() => {
              deleteSessionWithUndo(session);
              onClose();
            }}
          />
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              actions.updateSession(session.id, draft);
              onClose();
            }}
          >
            Salva
          </Button>
        </div>
      }
    >
      <h3 className="px-1 pb-3 pt-1 text-footnote font-semibold uppercase tracking-[0.04em] text-label-2">Ha pagato</h3>
      <div className="no-scrollbar -mx-5 flex gap-4 overflow-x-auto px-5 pb-1" role="radiogroup" aria-label="Chi ha pagato">
        {present.map((f) => {
          const on = draft.payerId === f.id;
          return (
            <button
              key={f.id}
              role="radio"
              aria-checked={on}
              onClick={() => setDraft((d) => ({ ...d, payerId: f.id }))}
              className="glass-button flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span className={`rounded-full p-[3px] transition-shadow ${on ? "shadow-[0_0_0_2.5px_var(--accent)]" : ""}`}>
                <Avatar friend={f} size={50} className={on ? "" : "opacity-60"} />
              </span>
              <span className={`w-full truncate text-caption font-semibold ${on ? "text-accent" : "text-label-2"}`}>{f.name}</span>
            </button>
          );
        })}
      </div>

      <ListSection header="Presenti" footer="Macchina ed extra valgono solo per chi c'era. Le modifiche ricalcolano subito saldi e probabilità.">
        {people.map((f) => {
          const here = draft.present.includes(f.id);
          const payer = draft.payerId === f.id;
          return (
            <ListRow
              key={f.id}
              inset={100}
              leading={
                <>
                  <button
                    role="checkbox"
                    aria-checked={here}
                    aria-label={`${f.name} c'era`}
                    disabled={payer}
                    onClick={() => setPresent(f.id, !here)}
                    className="glass-button -m-2 flex size-11 items-center justify-center disabled:opacity-50"
                  >
                    <span className={`flex size-[22px] items-center justify-center rounded-full ${here ? "bg-accent text-on-accent" : "border-[1.5px] border-label-3"}`}>
                      {here && <Check className="size-3.5" strokeWidth={3.2} />}
                    </span>
                  </button>
                  <Avatar friend={f} size={30} className={here ? "" : "opacity-40"} />
                </>
              }
              title={<span className={here ? "" : "text-label-3"}>{f.name}</span>}
              subtitle={payer ? "Ha pagato" : undefined}
              trailing={
                here && (
                  <div className="flex gap-1.5">
                    <IconToggle tone="blue" icon={Car} label={`${f.name} in macchina`} on={draft.drivers.includes(f.id)} onChange={(on) => setDraft((d) => ({ ...d, drivers: toggleId(d.drivers, f.id, on) }))} />
                    <IconToggle tone="orange" icon={CakeSlice} label={`Extra per ${f.name}`} on={draft.extras.includes(f.id)} onChange={(on) => setDraft((d) => ({ ...d, extras: toggleId(d.extras, f.id, on) }))} />
                  </div>
                )
              }
            />
          );
        })}
      </ListSection>
    </Sheet>
  );
}
