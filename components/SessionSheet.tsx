"use client";

import { useState } from "react";
import { CakeSlice, Car, Check, Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { deleteSessionWithUndo } from "@/components/sessionActions";
import { Button } from "@/components/ui/Button";
import { IconToggle } from "@/components/ui/IconToggle";
import { ListRow, ListSection } from "@/components/ui/List";
import { Sheet, SheetAction } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";
import { toLocalInput } from "@/lib/format";
import { toggleId } from "@/lib/list";
import { actions } from "@/lib/store";
import type { Session, State, Today } from "@/lib/types";

type Draft = Omit<Session, "id" | "odds" | "manual">;

/**
 * Un pagamento: si corregge un'estrazione esistente (`session`) o se ne
 * registra uno a mano, senza ruota, anche in una data passata.
 */
export function SessionSheet({
  state,
  session,
  initial,
  onClose,
  onSaved,
}: {
  state: State;
  session?: Session;
  /** Per un nuovo pagamento: presenti, macchina ed extra già scelti. */
  initial?: Today;
  onClose: () => void;
  onSaved?: (date: Date) => void;
}) {
  const active = state.friends.filter((f) => f.active);
  const [draft, setDraft] = useState<Draft>(() => {
    if (session) return session;
    const fallback = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.present ?? [];
    const present = (initial?.present.length ? initial.present : fallback).filter((id) => active.some((f) => f.id === id));
    return {
      date: new Date().toISOString(),
      present: present.length >= 2 ? present : active.map((f) => f.id),
      drivers: initial?.drivers ?? [],
      extras: initial?.extras ?? [],
      payerId: "",
    };
  });
  const people = state.friends.filter((f) => f.active || session?.present.includes(f.id) || session?.payerId === f.id);
  const present = people.filter((f) => draft.present.includes(f.id));
  const blocker = draft.present.length < 2 ? "Servono almeno 2 presenti" : !draft.present.includes(draft.payerId) ? "Scegli chi ha pagato" : null;

  const setPresent = (id: string, on: boolean) =>
    setDraft((d) => ({
      ...d,
      present: toggleId(d.present, id, on),
      drivers: on ? d.drivers : d.drivers.filter((x) => x !== id),
      extras: on ? d.extras : d.extras.filter((x) => x !== id),
      payerId: on || d.payerId !== id ? d.payerId : "",
    }));

  const save = () => {
    if (session) actions.updateSession(session.id, draft);
    else {
      actions.addSession({ ...draft, odds: {}, manual: true });
      toast("Pagamento registrato");
    }
    onSaved?.(new Date(draft.date));
  };

  return (
    <Sheet
      onClose={onClose}
      title={session ? "Modifica pagamento" : "Pagamento a mano"}
      footer={
        <div className="flex gap-2">
          {session && (
            <SheetAction onPress={() => deleteSessionWithUndo(session)}>
              {(press) => <Button variant="destructive" size="lg" icon={Trash2} aria-label="Elimina" onClick={press} />}
            </SheetAction>
          )}
          <SheetAction onPress={save}>
            {(press) => (
              <Button size="lg" className="flex-1" disabled={!!blocker} onClick={press}>
                {blocker ?? (session ? "Salva" : "Registra pagamento")}
              </Button>
            )}
          </SheetAction>
        </div>
      }
    >
      {!session && (
        <p className="px-1 pb-1 text-subhead text-label-2">
          Per quando qualcuno ha già offerto senza girare la ruota. Conta nei saldi come un&apos;estrazione.
        </p>
      )}

      <ListSection>
        <ListRow
          title="Quando"
          trailing={
            <input
              type="datetime-local"
              aria-label="Data e ora"
              value={toLocalInput(new Date(draft.date))}
              max={toLocalInput(new Date())}
              onChange={(e) => {
                const d = new Date(e.target.value);
                if (!Number.isNaN(d.getTime())) setDraft((x) => ({ ...x, date: d.toISOString() }));
              }}
              className="h-9 min-w-0 max-w-[70%] rounded-[9px] bg-fill px-2.5 text-body text-label outline-none [color-scheme:light_dark]"
            />
          }
        />
      </ListSection>

      <h3 className="px-4 pb-3 pt-7 text-footnote font-semibold uppercase tracking-[0.04em] text-label-2">Ha pagato</h3>
      {present.length ? (
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
                  <Avatar friend={f} size={50} className={on || !draft.payerId ? "" : "opacity-50"} />
                </span>
                <span className={`w-full truncate text-caption font-semibold ${on ? "text-accent" : "text-label-2"}`}>{f.name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="px-4 text-subhead text-label-3">Segna prima chi c&apos;era.</p>
      )}

      <ListSection header="Presenti" footer="Macchina ed extra valgono solo per chi c'era. Saldi e probabilità si ricalcolano subito.">
        {people.map((f) => {
          const here = draft.present.includes(f.id);
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
                    onClick={() => setPresent(f.id, !here)}
                    className="glass-button -m-2 flex size-11 items-center justify-center"
                  >
                    <span className={`flex size-[22px] items-center justify-center rounded-full ${here ? "bg-accent text-on-accent" : "border-[1.5px] border-label-3"}`}>
                      {here && <Check className="size-3.5" strokeWidth={3.2} />}
                    </span>
                  </button>
                  <Avatar friend={f} size={30} className={here ? "" : "opacity-40"} />
                </>
              }
              title={<span className={here ? "" : "text-label-3"}>{f.name}</span>}
              subtitle={draft.payerId === f.id ? "Ha pagato" : undefined}
              trailing={
                here && (
                  <div className="flex gap-1.5">
                    <IconToggle
                      tone="blue"
                      icon={Car}
                      label={`${f.name} in macchina`}
                      on={draft.drivers.includes(f.id)}
                      onChange={(on) => setDraft((d) => ({ ...d, drivers: toggleId(d.drivers, f.id, on) }))}
                    />
                    <IconToggle
                      tone="orange"
                      icon={CakeSlice}
                      label={`Extra per ${f.name}`}
                      on={draft.extras.includes(f.id)}
                      onChange={(on) => setDraft((d) => ({ ...d, extras: toggleId(d.extras, f.id, on) }))}
                    />
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
