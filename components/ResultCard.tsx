"use client";

import { useState } from "react";
import { Pencil, Share, Undo2, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { SessionSheet } from "@/components/SessionSheet";
import { deleteSessionWithUndo, shareResult } from "@/components/sessionActions";
import { Glass } from "@/components/ui/Glass";
import { ListRow, ListSection } from "@/components/ui/List";
import { Switch } from "@/components/ui/Switch";
import { clock, percent } from "@/lib/format";
import { toggleId } from "@/lib/list";
import { actions } from "@/lib/store";
import type { Session, State } from "@/lib/types";

/** Chi offre, con le azioni rapide e gli extra segnabili anche dopo l'estrazione. */
export function ResultCard({ session, state, fresh = false }: { session: Session; state: State; fresh?: boolean }) {
  const [editing, setEditing] = useState(false);
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const payer = byId.get(session.payerId);
  if (!payer) return null;

  return (
    <div className="flex flex-col">
      <Glass className={`overflow-hidden rounded-[30px] px-5 pb-5 pt-7 text-center ${fresh ? "animate-pop" : "animate-rise"}`}>
        {/* Alone del colore di chi paga */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40 blur-2xl"
          style={{ background: `radial-gradient(60% 70% at 50% 0%, ${payer.color}, transparent 70%)` }}
          aria-hidden
        />
        <Avatar friend={payer} size={88} className="relative shadow-[0_10px_30px_-8px_rgb(0_0_0/0.35)]" />
        <p className="relative mt-4 text-footnote font-semibold uppercase tracking-[0.08em] text-label-2">
          {fresh ? "Oggi offre" : `Ha offerto alle ${clock(session.date)}`}
        </p>
        <h2 className="relative text-[40px] font-bold leading-[46px] tracking-[-0.02em]">{payer.name}</h2>
        <p className="relative mt-1 text-subhead text-label-2">
          {session.present.length} caffè
          {session.extras.length > 0 && ` + ${session.extras.length} extra`} ·{" "}
          {session.manual ? (
            "inserito a mano"
          ) : (
            <>
              aveva il <span className="font-rounded font-semibold text-label">{percent(session.odds[payer.id] ?? 0)}</span>
            </>
          )}
        </p>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <ActionTile icon={Share} label="Condividi" onClick={() => void shareResult(session, state)} />
          <ActionTile icon={Pencil} label="Modifica" onClick={() => setEditing(true)} />
          <ActionTile icon={Undo2} label="Annulla" tone="red" onClick={() => deleteSessionWithUndo(session)} />
        </div>
      </Glass>

      <ListSection header="Extra" footer="Dolce, amaro, cornetto… Si segnano anche più tardi: contano per le prossime estrazioni.">
        {session.present.map((id) => {
          const f = byId.get(id);
          if (!f) return null;
          const on = session.extras.includes(id);
          return (
            <ListRow
              key={id}
              leading={<Avatar friend={f} size={30} />}
              title={f.name}
              trailing={
                <Switch
                  on={on}
                  label={`Extra per ${f.name}`}
                  onChange={(v) => actions.updateSession(session.id, { extras: toggleId(session.extras, id, v) })}
                />
              }
            />
          );
        })}
      </ListSection>

      {editing && <SessionSheet session={session} state={state} onClose={() => setEditing(false)} />}
    </div>
  );
}

function ActionTile({ icon: Icon, label, onClick, tone }: { icon: LucideIcon; label: string; onClick: () => void; tone?: "red" }) {
  return (
    <button
      onClick={onClick}
      className={`glass-button flex h-[62px] flex-col items-center justify-center gap-1 rounded-[18px] bg-fill text-caption font-semibold ${tone === "red" ? "text-red" : "text-accent"}`}
    >
      <Icon className="size-[22px]" strokeWidth={2} aria-hidden />
      {label}
    </button>
  );
}
