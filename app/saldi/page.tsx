"use client";

import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Glass, SectionHeader } from "@/components/ui/Glass";
import { BETA, ledger } from "@/lib/fairness";
import { decimal, signed } from "@/lib/format";
import type { State } from "@/lib/types";

export default function SaldiPage() {
  return <AppShell title="Saldi">{(state) => <Saldi state={state} />}</AppShell>;
}

function Saldi({ state }: { state: State }) {
  const book = ledger(state.sessions, state.settings);
  const rows = state.friends
    .map((f) => ({ f, st: book[f.id] }))
    .sort((a, b) => (b.st?.balance ?? 0) - (a.st?.balance ?? 0));
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.st?.balance ?? 0)));
  const factor = Math.exp(BETA[state.settings.fairness]);

  return (
    <>
      <p className="px-1 pb-3 text-footnote text-label-2">
        Saldo = caffè consumati − caffè pagati, ± macchina. In alto chi deve offrire, in basso chi è in credito.
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map(({ f, st }) => {
          const b = st?.balance ?? 0;
          const owes = b > 0.05;
          const credit = b < -0.05;
          return (
            <li key={f.id}>
              <Glass className={`rounded-2xl p-3.5 ${f.active ? "" : "opacity-55"}`}>
                <div className="flex items-center gap-3">
                  <Avatar friend={f} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-headline">
                      {f.name} {!f.active && <span className="text-footnote font-normal text-label-2">· non attivo</span>}
                    </div>
                    <div className="text-caption text-label-2">{owes ? "deve offrire" : credit ? "in credito" : "in pari"}</div>
                  </div>
                  <span className={`text-title-2 tabular-nums ${owes ? "text-red" : credit ? "text-green" : "text-label-2"}`}>{signed(b)}</span>
                </div>

                {/* Barra divergente: a destra il debito, a sinistra il credito */}
                <div className="relative mt-3 h-2 rounded-full bg-fill">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-label-3" />
                  <div
                    className={`absolute inset-y-0 rounded-full ${owes ? "bg-red" : "bg-green"}`}
                    style={b >= 0 ? { left: "50%", width: `${(b / max) * 50}%` } : { right: "50%", width: `${(-b / max) * 50}%` }}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-5 gap-1 text-center">
                  <Stat label="presenze" value={st?.presences ?? 0} />
                  <Stat label="ha pagato" value={st?.paidTimes ?? 0} />
                  <Stat label="offerti" value={decimal(st?.given ?? 0)} />
                  <Stat label="extra" value={st?.extras ?? 0} />
                  <Stat label="macchina" value={st?.drives ?? 0} />
                </dl>
              </Glass>
            </li>
          );
        })}
      </ul>

      <SectionHeader>Come si calcola</SectionHeader>
      <Glass className="rounded-2xl p-4 text-subhead text-label-2">
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
          <li>Ogni pranzo chi c&apos;è consuma 1 caffè, più {decimal(state.settings.extraValue)} se prende un extra.</li>
          <li>Chi paga versa i caffè di tutti i presenti.</li>
          <li>
            Chi porta la macchina guadagna {decimal(state.settings.carBonus)} caffè di credito, pagati in parti uguali dai passeggeri.
          </li>
          <li>
            Ogni caffè di saldo moltiplica le probabilità di uscire per <b className="text-label">×{decimal(Math.round(factor * 10) / 10)}</b>{" "}
            (equità “{state.settings.fairness}”). Nessuno arriva mai a zero.
          </li>
          <li>Chi viene di rado consuma poco, quindi paga di rado: la presenza è già nel saldo.</li>
        </ul>
      </Glass>
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse rounded-xl bg-fill px-1 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-label-2">{label}</dt>
      <dd className="text-headline tabular-nums">{value}</dd>
    </div>
  );
}
