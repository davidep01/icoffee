"use client";

import { useState } from "react";
import { CakeSlice, Pencil, Undo2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { EditSessionSheet } from "@/components/EditSessionSheet";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Toggle } from "@/components/ui/Toggle";
import { clock, percent } from "@/lib/format";
import { toggleId } from "@/lib/list";
import { actions } from "@/lib/store";
import type { Session, State } from "@/lib/types";

/** Chi ha pagato, con gli extra segnabili anche dopo l'estrazione. */
export function ResultCard({
  session,
  state,
  fresh = false,
  children,
}: {
  session: Session;
  state: State;
  fresh?: boolean;
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const payer = byId.get(session.payerId);
  if (!payer) return null;

  return (
    <Glass className={`rounded-[28px] p-5 ${fresh ? "animate-pop" : "animate-rise"}`}>
      <div className="flex flex-col items-center text-center">
        <Avatar friend={payer} size={68} />
        <div className="mt-3 text-footnote font-semibold uppercase tracking-wide text-label-2">
          {fresh ? "Oggi offre" : `Ha offerto alle ${clock(session.date)}`}
        </div>
        <div className="text-title-1">{payer.name}</div>
        <div className="mt-1 text-subhead text-label-2">
          aveva il {percent(session.odds[payer.id] ?? 0)} di probabilità · {session.present.length} caffè
        </div>
      </div>

      <div className="mt-5 border-t border-separator pt-4">
        <div className="text-headline">Qualcuno ha preso un extra?</div>
        <p className="text-footnote text-label-2">Si può segnare anche dopo: conta per le prossime estrazioni.</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {session.present.map((id) => {
            const f = byId.get(id);
            if (!f) return null;
            return (
              <Toggle
                key={id}
                on={session.extras.includes(id)}
                onChange={(on) => actions.updateSession(session.id, { extras: toggleId(session.extras, id, on) })}
                icon={CakeSlice}
                label={f.name}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="tinted" size="sm" icon={Pencil} onClick={() => setEditing(true)}>
          Modifica
        </Button>
        <Button
          variant="plain"
          size="sm"
          icon={Undo2}
          onClick={() => confirm("Annullare l'estrazione? Non conterà nei saldi.") && actions.deleteSession(session.id)}
        >
          Annulla estrazione
        </Button>
        {children}
      </div>

      {editing && <EditSessionSheet session={session} state={state} onClose={() => setEditing(false)} />}
    </Glass>
  );
}
