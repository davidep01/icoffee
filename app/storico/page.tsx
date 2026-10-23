"use client";

import { useState } from "react";
import { CakeSlice, Car, ChevronRight, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { EditSessionSheet } from "@/components/EditSessionSheet";
import { Chip } from "@/components/ui/Chip";
import { Glass } from "@/components/ui/Glass";
import { clock, percent, shortDate } from "@/lib/format";
import type { State } from "@/lib/types";

export default function StoricoPage() {
  return <AppShell title="Storico">{(state) => <Storico state={state} />}</AppShell>;
}

function Storico({ state }: { state: State }) {
  const [editing, setEditing] = useState<string | null>(null);
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const sessions = [...state.sessions].sort((a, b) => b.date.localeCompare(a.date));
  const current = editing ? state.sessions.find((s) => s.id === editing) : undefined;

  if (sessions.length === 0) {
    return <Glass className="mt-2 rounded-[28px] p-6 text-center text-label-2">Ancora nessuna estrazione: gira la prima ruota da “Oggi”.</Glass>;
  }

  return (
    <>
      <p className="px-1 pb-3 text-footnote text-label-2">Tocca un&apos;estrazione per correggere extra, macchina, presenti o chi ha pagato.</p>
      <ul className="flex flex-col gap-2">
        {sessions.map((s) => {
          const payer = byId.get(s.payerId);
          const drivers = s.drivers.map((id) => byId.get(id)?.name).filter(Boolean);
          return (
            <li key={s.id}>
              <button onClick={() => setEditing(s.id)} className="glass glass-button flex w-full items-center gap-3 rounded-2xl p-3 text-left">
                {payer && <Avatar friend={payer} size={40} />}
                <div className="min-w-0 flex-1">
                  <div className="text-caption font-semibold uppercase tracking-wide text-label-2">
                    {shortDate(s.date)} · {clock(s.date)}
                  </div>
                  <div className="truncate text-headline">
                    {payer?.name ?? "?"} <span className="font-normal text-label-2">({percent(s.odds[s.payerId] ?? 0)})</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Chip icon={Users}>{s.present.length}</Chip>
                    {s.extras.length > 0 && (
                      <Chip tone="accent" icon={CakeSlice}>
                        {s.extras.length} extra
                      </Chip>
                    )}
                    {drivers.length > 0 && (
                      <Chip tone="blue" icon={Car}>
                        {drivers.join(", ")}
                      </Chip>
                    )}
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-label-3" aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      {current && <EditSessionSheet key={current.id} session={current} state={state} onClose={() => setEditing(null)} />}
    </>
  );
}
