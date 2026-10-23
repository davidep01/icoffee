"use client";

import { useState } from "react";
import { CakeSlice, Car, Check, Trash2, Wallet } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Toggle } from "@/components/ui/Toggle";
import { actions } from "@/lib/store";
import { clock, shortDate } from "@/lib/format";
import { toggleId as toggle } from "@/lib/list";
import type { Session, State } from "@/lib/types";

/** Correggere un'estrazione passata: presenti, macchina, extra, chi ha pagato. */
export function EditSessionSheet({ session, state, onClose }: { session: Session; state: State; onClose: () => void }) {
  const [draft, setDraft] = useState(session);
  const people = state.friends.filter((f) => f.active || session.present.includes(f.id) || session.payerId === f.id);

  const setPresent = (id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      present: toggle(d.present, id, on),
      drivers: on ? d.drivers : d.drivers.filter((x) => x !== id),
      extras: on ? d.extras : d.extras.filter((x) => x !== id),
    }));

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${shortDate(session.date)} · ${clock(session.date)}`}
      footer={
        <div className="flex gap-2">
          <Button
            variant="destructive"
            icon={Trash2}
            onClick={() => {
              if (!confirm("Eliminare questa estrazione? I saldi verranno ricalcolati.")) return;
              actions.deleteSession(session.id);
              onClose();
            }}
          >
            Elimina
          </Button>
          <Button
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
      <p className="pb-3 text-footnote text-label-2">Le modifiche ricalcolano subito saldi e probabilità.</p>
      <ul className="flex flex-col gap-2">
        {people.map((f) => {
          const present = draft.present.includes(f.id);
          const payer = draft.payerId === f.id;
          return (
            <li key={f.id} className="rounded-2xl bg-fill p-3">
              <div className="flex items-center gap-2.5">
                <Avatar friend={f} size={30} />
                <span className={`flex-1 truncate text-headline ${present ? "" : "text-label-3"}`}>{f.name}</span>
                <Toggle on={present} onChange={(on) => setPresent(f.id, on)} icon={Check} label="C'era" disabled={payer} />
              </div>
              {present && (
                <div className="mt-2 flex flex-wrap gap-1.5 pl-10">
                  <Toggle on={payer} onChange={() => setDraft((d) => ({ ...d, payerId: f.id }))} icon={Wallet} label="Ha pagato" />
                  <Toggle
                    on={draft.drivers.includes(f.id)}
                    onChange={(on) => setDraft((d) => ({ ...d, drivers: toggle(d.drivers, f.id, on) }))}
                    icon={Car}
                    label="Macchina"
                  />
                  <Toggle
                    on={draft.extras.includes(f.id)}
                    onChange={(on) => setDraft((d) => ({ ...d, extras: toggle(d.extras, f.id, on) }))}
                    icon={CakeSlice}
                    label="Extra"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
