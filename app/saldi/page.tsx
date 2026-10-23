"use client";

import { useState } from "react";
import { CakeSlice, Car, Coffee, Scale, Users, Wallet, type LucideIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Glass } from "@/components/ui/Glass";
import { IconTile, ListRow, ListSection } from "@/components/ui/List";
import { Sheet } from "@/components/ui/Sheet";
import { BETA, ledger, todayOdds, type Stats } from "@/lib/fairness";
import { decimal, percent, shortDate, signed } from "@/lib/format";
import type { Friend, State } from "@/lib/types";

export default function SaldiPage() {
  return <AppShell title="Saldi">{(state) => <Saldi state={state} />}</AppShell>;
}

const EMPTY: Stats = { presences: 0, paidTimes: 0, given: 0, consumed: 0, extras: 0, drives: 0, balance: 0 };

function tone(b: number) {
  return b > 0.05 ? "text-red" : b < -0.05 ? "text-green" : "text-label-2";
}

function Saldi({ state }: { state: State }) {
  const [person, setPerson] = useState<Friend | null>(null);
  const [how, setHow] = useState(false);
  const book = ledger(state.sessions, state.settings);
  const rows = state.friends
    .map((f) => ({ f, st: book[f.id] ?? EMPTY }))
    .sort((a, b) => b.st.balance - a.st.balance);
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.st.balance)));

  // Se domani ci fossero tutti, senza macchina né extra
  const active = state.friends.filter((f) => f.active);
  const next = active.length >= 2 ? todayOdds(state.sessions, { present: active.map((f) => f.id), drivers: [], extras: [] }, state.settings) : [];
  const top = next.length ? next.reduce((a, b) => (b.p > a.p ? b : a)) : null;
  const topFriend = top && state.friends.find((f) => f.id === top.id);

  return (
    <>
      {topFriend && state.sessions.length > 0 && (
        <Glass className="flex items-center gap-4 overflow-hidden rounded-[26px] p-4">
          <div
            className="pointer-events-none absolute -left-6 top-0 h-full w-40 opacity-30 blur-2xl"
            style={{ background: `radial-gradient(closest-side, ${topFriend.color}, transparent)` }}
            aria-hidden
          />
          <Avatar friend={topFriend} size={56} className="relative" />
          <div className="relative min-w-0 flex-1">
            <p className="text-footnote font-semibold uppercase tracking-[0.06em] text-label-2">Il prossimo a offrire</p>
            <p className="truncate text-title-2">{topFriend.name}</p>
            <p className="text-subhead text-label-2">
              <span className="font-rounded font-semibold text-label">{percent(top!.p)}</span> se domani ci siete tutti
            </p>
          </div>
        </Glass>
      )}

      <ListSection
        header="Saldo in caffè"
        footer={
          <button onClick={() => setHow(true)} className="-my-2 h-11 text-accent">
            Come si calcola?
          </button>
        }
      >
        {rows.map(({ f, st }) => {
          const b = st.balance;
          const w = `${(Math.abs(b) / max) * 50}%`;
          return (
            <ListRow
              key={f.id}
              inset={62}
              onClick={() => setPerson(f)}
              label={`${f.name}, saldo ${signed(b)}`}
              leading={<Avatar friend={f} size={32} className={f.active ? "" : "opacity-50"} />}
              title={<span className={f.active ? "" : "text-label-2"}>{f.name}</span>}
              trailing={
                <div className="flex w-[54%] items-center gap-2.5">
                  <div className="relative h-2 flex-1 rounded-full bg-fill" aria-hidden>
                    <div className="absolute inset-y-[-3px] left-1/2 w-px bg-label-3" />
                    {Math.abs(b) > 0.05 && (
                      <div
                        className={`animate-grow absolute inset-y-0 rounded-full ${b > 0 ? "bg-red" : "bg-green"}`}
                        style={b > 0 ? { left: "50%", width: w, transformOrigin: "left" } : { right: "50%", width: w, transformOrigin: "right" }}
                      />
                    )}
                  </div>
                  <span className={`font-rounded w-11 text-right text-headline ${tone(b)}`}>{signed(b)}</span>
                </div>
              }
              chevron
            />
          );
        })}
      </ListSection>
      <p className="flex justify-center gap-4 px-4 pt-3 text-footnote text-label-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red" /> deve offrire
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-green" /> in credito
        </span>
      </p>

      {person && <PersonSheet friend={person} stats={book[person.id] ?? EMPTY} state={state} onClose={() => setPerson(null)} />}
      {how && <HowSheet state={state} onClose={() => setHow(false)} />}
    </>
  );
}

function PersonSheet({ friend, stats, state, onClose }: { friend: Friend; stats: Stats; state: State; onClose: () => void }) {
  const b = stats.balance;
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const recent = [...state.sessions]
    .filter((s) => s.present.includes(friend.id))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8);

  return (
    <Sheet title={friend.name} onClose={onClose}>
      <div className="flex flex-col items-center pt-1 text-center">
        <Avatar friend={friend} size={72} />
        <div className={`font-rounded mt-3 text-[44px] font-bold leading-none ${tone(b)}`}>{signed(b)}</div>
        <p className="mt-1.5 text-subhead text-label-2">
          {b > 0.05 ? `deve offrire circa ${decimal(Math.round(b * 10) / 10)} caffè` : b < -0.05 ? `in credito di ${decimal(Math.round(-b * 10) / 10)} caffè` : "in pari col gruppo"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <StatTile icon={Users} label="presenze" value={stats.presences} />
        <StatTile icon={Wallet} label="ha offerto" value={stats.paidTimes} />
        <StatTile icon={Coffee} label="caffè offerti" value={decimal(stats.given)} />
        <StatTile icon={Coffee} label="caffè bevuti" value={decimal(stats.consumed)} />
        <StatTile icon={CakeSlice} label="extra" value={stats.extras} />
        <StatTile icon={Car} label="macchina" value={stats.drives} />
      </div>

      {recent.length > 0 && (
        <ListSection header="Ultime volte">
          {recent.map((s) => {
            const payer = byId.get(s.payerId);
            const paid = s.payerId === friend.id;
            return (
              <ListRow
                key={s.id}
                title={shortDate(s.date)}
                subtitle={paid ? "Ha offerto" : `Ha offerto ${payer?.name ?? "?"}`}
                trailing={
                  <div className="flex items-center gap-1.5">
                    {s.drivers.includes(friend.id) && <Car className="size-4 text-blue" aria-label="in macchina" />}
                    {s.extras.includes(friend.id) && <CakeSlice className="size-4 text-orange" aria-label="extra" />}
                    {paid && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-caption font-semibold text-accent">offerto</span>}
                  </div>
                }
              />
            );
          })}
        </ListSection>
      )}
    </Sheet>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-fill p-3">
      <Icon className="size-4 text-accent" strokeWidth={2.2} aria-hidden />
      <div className="font-rounded mt-1.5 text-title-2">{value}</div>
      <div className="text-caption text-label-2">{label}</div>
    </div>
  );
}

function HowSheet({ state, onClose }: { state: State; onClose: () => void }) {
  const s = state.settings;
  const factor = decimal(Math.round(Math.exp(BETA[s.fairness]) * 10) / 10);
  const steps: { icon: LucideIcon; color: string; title: string; text: string }[] = [
    { icon: Coffee, color: "#8A4A1F", title: "Chi c'è consuma", text: `1 caffè a testa, più ${decimal(s.extraValue)} per chi prende un extra.` },
    { icon: Wallet, color: "#34C759", title: "Chi paga versa", text: "i caffè di tutti i presenti: il suo saldo scende, quello degli altri sale." },
    { icon: Car, color: "#007AFF", title: "Chi guida guadagna", text: `${decimal(s.carBonus)} caffè di credito, pagati in parti uguali dai passeggeri.` },
    {
      icon: Scale,
      color: "#AF52DE",
      title: "La ruota pesa i saldi",
      text: s.fairness === "fortuna" ? "Con equità “fortuna” i saldi non contano: tutti uguali." : `Ogni caffè di saldo moltiplica le probabilità per ×${factor}. Nessuno arriva mai a zero.`,
    },
  ];
  return (
    <Sheet title="Come si calcola" onClose={onClose}>
      <ul className="flex flex-col gap-5 pt-2">
        {steps.map((st) => (
          <li key={st.title} className="flex gap-3.5">
            <IconTile icon={st.icon} color={st.color} />
            <div>
              <div className="text-headline">{st.title}</div>
              <p className="text-subhead text-label-2">{st.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 rounded-[18px] bg-fill p-4 text-subhead text-label-2">
        Chi viene di rado consuma poco, quindi paga di rado: la presenza è già nel saldo. Esempio: se in 5 e ieri Marco ha offerto a tutti, il suo saldo è −4 e oggi esce
        quasi mai.
      </p>
    </Sheet>
  );
}
