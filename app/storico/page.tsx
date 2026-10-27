"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronRight, Dices, History, PenLine, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { SessionSheet } from "@/components/SessionSheet";
import { deleteSessionWithUndo } from "@/components/sessionActions";
import { IconButton } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { Glass } from "@/components/ui/Glass";
import { ListSection } from "@/components/ui/List";
import { SwipeRow } from "@/components/ui/SwipeRow";
import { clock, percent, sameDay } from "@/lib/format";
import type { Session, State } from "@/lib/types";

export default function StoricoPage() {
  const [adding, setAdding] = useState(false);
  return (
    <AppShell title="Storico" trailing={<IconButton icon={Plus} label="Inserisci un pagamento a mano" onClick={() => setAdding(true)} />}>
      {(state) => (
        <>
          <Storico state={state} onAdd={() => setAdding(true)} />
          {adding && <SessionSheet state={state} onClose={() => setAdding(false)} />}
        </>
      )}
    </AppShell>
  );
}

const weekday = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });
const withYear = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });

function dayLabel(d: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return "Oggi";
  if (sameDay(d, yesterday)) return "Ieri";
  return d.getFullYear() === now.getFullYear() ? weekday.format(d) : withYear.format(d);
}

function Storico({ state, onAdd }: { state: State; onAdd: () => void }) {
  const [editing, setEditing] = useState<string | null>(null);
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const current = editing ? state.sessions.find((s) => s.id === editing) : undefined;

  const now = new Date();
  const groups = new Map<string, Session[]>();
  for (const s of [...state.sessions].sort((a, b) => b.date.localeCompare(a.date))) {
    const label = dayLabel(new Date(s.date), now);
    groups.set(label, [...(groups.get(label) ?? []), s]);
  }

  if (state.sessions.length === 0) {
    return (
      <ContentUnavailable
        icon={History}
        title="Nessuna estrazione"
        description="Ogni giro della ruota comparirà qui, con chi c'era, chi ha guidato e gli extra."
        action={
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="glass-button inline-flex h-11 items-center gap-2 rounded-full bg-accent px-5 text-headline text-on-accent">
              <Dices className="size-5" aria-hidden /> Gira la ruota
            </Link>
            <button onClick={onAdd} className="inline-flex h-11 items-center gap-1.5 px-3 text-body text-accent">
              <PenLine className="size-4" aria-hidden /> Inserisci a mano
            </button>
          </div>
        }
      />
    );
  }

  const coffees = state.sessions.reduce((n, s) => n + s.present.length, 0);
  const extras = state.sessions.reduce((n, s) => n + s.extras.length, 0);

  return (
    <>
      <Glass className="grid grid-cols-3 divide-x divide-separator rounded-[22px] py-3.5 text-center">
        <Total value={state.sessions.length} label="estrazioni" />
        <Total value={coffees} label="caffè" />
        <Total value={extras} label="extra" />
      </Glass>

      {[...groups].map(([label, list]) => (
        <ListSection key={label} header={label}>
          {list.map((s) => {
            const payer = byId.get(s.payerId);
            const drivers = s.drivers.map((id) => byId.get(id)?.name).filter(Boolean);
            const details = [`${s.present.length} caffè`];
            if (s.extras.length) details.push(`${s.extras.length} extra`);
            if (drivers.length) details.push(`${drivers.join(" e ")} in macchina`);
            return (
              <li key={s.id} className="list-row" style={{ "--inset": "70px" } as CSSProperties}>
                <SwipeRow onDelete={() => deleteSessionWithUndo(s)}>
                  <button onClick={() => setEditing(s.id)} className="list-press flex min-h-[64px] w-full items-center gap-3.5 px-4 py-2.5 text-left">
                    {payer && <Avatar friend={payer} size={40} />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-body">
                        <span className="font-semibold">{payer?.name ?? "?"}</span>
                        <span className="text-label-2"> ha offerto</span>
                      </div>
                      <div className="truncate text-footnote text-label-2">{details.join(" · ")}</div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span className="text-subhead text-label-2">{clock(s.date)}</span>
                      {s.manual ? (
                        <span className="inline-flex items-center gap-0.5 text-caption text-label-3">
                          <PenLine className="size-3" aria-hidden /> a mano
                        </span>
                      ) : (
                        <span className="font-rounded text-caption text-label-3">{percent(s.odds[s.payerId] ?? 0)}</span>
                      )}
                    </div>
                    <ChevronRight className="-mr-1 size-5 shrink-0 text-label-3" strokeWidth={2.4} aria-hidden />
                  </button>
                </SwipeRow>
              </li>
            );
          })}
        </ListSection>
      ))}
      <p className="px-4 pt-4 text-center text-footnote text-label-3">Tocca per correggere, scorri a sinistra per eliminare, + per inserire a mano.</p>

      {current && <SessionSheet key={current.id} session={current} state={state} onClose={() => setEditing(null)} />}
    </>
  );
}

function Total({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="font-rounded text-title-2">{value}</div>
      <div className="text-caption font-semibold uppercase tracking-[0.04em] text-label-2">{label}</div>
    </div>
  );
}
