"use client";

import { useCallback, useMemo, useState } from "react";
import { CakeSlice, Car, Check, ChevronLeft, Dices, Plus, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { ResultCard } from "@/components/ResultCard";
import { Wheel } from "@/components/Wheel";
import { Button } from "@/components/ui/Button";
import { Glass, SectionHeader } from "@/components/ui/Glass";
import { Toggle } from "@/components/ui/Toggle";
import { todayOdds, type Odds } from "@/lib/fairness";
import { percent, sameDay, signed } from "@/lib/format";
import { toggleId } from "@/lib/list";
import { pickWeighted, secureRandom } from "@/lib/random";
import { actions } from "@/lib/store";
import type { State, Today } from "@/lib/types";
import { layoutSlices, targetRotation, type Slice } from "@/lib/wheel";

const todayLabel = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

export default function OggiPage() {
  return (
    <AppShell title="Chi paga oggi?" subtitle={todayLabel.format(new Date())}>
      {(state) => <Oggi state={state} />}
    </AppShell>
  );
}

type Mode = "home" | "presenti" | "ruota";

interface Spin {
  slices: Slice[];
  sessionId: string;
  done: boolean;
}

function Oggi({ state }: { state: State }) {
  const now = new Date();
  const todaySessions = state.sessions.filter((s) => sameDay(new Date(s.date), now)).sort((a, b) => b.date.localeCompare(a.date));
  const active = state.friends.filter((f) => f.active);
  const byId = useMemo(() => new Map(state.friends.map((f) => [f.id, f])), [state.friends]);

  const [mode, setMode] = useState<Mode>(todaySessions.length ? "home" : "presenti");
  const [today, setToday] = useState<Today>(() => {
    // Si parte da chi c'era l'ultima volta
    const last = [...state.sessions].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
    const present = last ? last.present.filter((id) => active.some((f) => f.id === id)) : [];
    return { present: present.length >= 2 ? present : active.map((f) => f.id), drivers: [], extras: [] };
  });
  const [spin, setSpin] = useState<Spin | null>(null);
  const [rotation, setRotation] = useState(0);

  const odds = useMemo(() => todayOdds(state.sessions, today, state.settings), [state.sessions, today, state.settings]);
  const liveSlices = useMemo(
    () => layoutSlices(odds.map((o) => ({ id: o.id, label: byId.get(o.id)?.name ?? "?", color: byId.get(o.id)?.color ?? "#999", p: o.p }))),
    [odds, byId],
  );
  const spinSession = spin && state.sessions.find((s) => s.id === spin.sessionId);

  const go = () => {
    const i = pickWeighted(odds.map((o) => o.p));
    // L'estrazione si salva subito: chiudere l'app a metà giro non la annulla
    const sessionId = actions.addSession({
      date: new Date().toISOString(),
      ...today,
      payerId: odds[i].id,
      odds: Object.fromEntries(odds.map((o) => [o.id, o.p])),
    });
    setSpin({ slices: liveSlices, sessionId, done: false });
    setRotation((r) => targetRotation(liveSlices[i], r, secureRandom));
  };

  const onSpinEnd = useCallback(() => {
    setSpin((s) => (s && !s.done ? { ...s, done: true } : s));
    navigator.vibrate?.([30, 60, 90]);
  }, [setSpin]);

  const finish = () => {
    setSpin(null);
    setMode("home");
  };

  // ---------------------------------------------------------------- home
  if (mode === "home") {
    return (
      <div className="flex flex-col gap-4">
        {todaySessions.map((s) => (
          <ResultCard key={s.id} session={s} state={state} />
        ))}
        {todaySessions.length === 0 && (
          <Glass className="rounded-[28px] p-5 text-center text-label-2">Nessuna estrazione oggi.</Glass>
        )}
        <Button
          size="lg"
          variant={todaySessions.length ? "tinted" : "filled"}
          icon={Dices}
          onClick={() => {
            // Stessi presenti, ma macchina ed extra si risegnano
            setToday((t) => ({ ...t, drivers: [], extras: [] }));
            setMode("presenti");
          }}
        >
          Nuova estrazione
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------- presenti
  if (mode === "presenti") {
    return (
      <Presence
        state={state}
        present={today.present}
        onChange={(present) =>
          setToday((t) => ({
            present,
            drivers: t.drivers.filter((id) => present.includes(id)),
            extras: t.extras.filter((id) => present.includes(id)),
          }))
        }
        onNext={() => setMode("ruota")}
        onBack={todaySessions.length ? () => setMode("home") : undefined}
      />
    );
  }

  // ---------------------------------------------------------------- ruota
  const spinning = !!spin && !spin.done;
  return (
    <div className="flex flex-col gap-4">
      {!spin && (
        <button onClick={() => setMode("presenti")} className="-mt-1 inline-flex items-center gap-1 self-start text-subhead font-semibold text-accent">
          <ChevronLeft className="size-4" strokeWidth={2.6} /> {today.present.length} presenti
        </button>
      )}

      <div className="py-2">
        <Wheel slices={spin ? spin.slices : liveSlices} rotation={rotation} spinning={spinning} onSpinEnd={onSpinEnd} />
      </div>

      {!spin && (
        <>
          <Button size="lg" icon={Dices} onClick={go}>
            Gira la ruota
          </Button>
          <OddsList odds={odds} state={state} today={today} setToday={setToday} />
        </>
      )}

      {spinning && <p className="text-center text-headline text-label-2">Gira, gira…</p>}

      {spin?.done && spinSession && (
        <ResultCard session={spinSession} state={state} fresh>
          <Button size="sm" icon={Check} className="ml-auto" onClick={finish}>
            Fatto
          </Button>
        </ResultCard>
      )}
      {spin?.done && !spinSession && (
        <Glass className="flex flex-col items-center gap-3 rounded-[28px] p-5 text-center">
          <span className="text-headline">Estrazione annullata</span>
          <Button icon={Dices} onClick={() => setSpin(null)}>
            Rigira
          </Button>
        </Glass>
      )}
    </div>
  );
}

function Presence({
  state,
  present,
  onChange,
  onNext,
  onBack,
}: {
  state: State;
  present: string[];
  onChange: (present: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const [name, setName] = useState("");
  const active = state.friends.filter((f) => f.active);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    actions.addFriend(n);
    setName("");
  };

  return (
    <div className="flex flex-col gap-3">
      {onBack && (
        <button onClick={onBack} className="-mt-1 inline-flex items-center gap-1 self-start text-subhead font-semibold text-accent">
          <ChevronLeft className="size-4" strokeWidth={2.6} /> Oggi
        </button>
      )}
      <SectionHeader
        action={
          <button
            className="text-subhead font-semibold text-accent"
            onClick={() => onChange(present.length === active.length ? [] : active.map((f) => f.id))}
          >
            {present.length === active.length ? "Nessuno" : "Tutti"}
          </button>
        }
      >
        Chi c&apos;è oggi?
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {active.map((f) => {
          const on = present.includes(f.id);
          return (
            <button
              key={f.id}
              aria-pressed={on}
              onClick={() => onChange(toggleId(present, f.id, !on))}
              className={`glass-button flex items-center gap-2.5 rounded-2xl p-3 text-left ${on ? "glass glass-strong" : "bg-fill opacity-60"}`}
            >
              <Avatar friend={f} size={34} />
              <span className="min-w-0 flex-1 truncate text-headline">{f.name}</span>
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full ${on ? "bg-accent text-on-accent" : "border-2 border-label-3"}`}
              >
                {on && <Check className="size-4" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-fill px-4">
          <UserPlus className="size-4 text-label-3" aria-hidden />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Si aggiunge qualcuno?"
            className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-label-3"
          />
        </label>
        <Button type="submit" variant="tinted" icon={Plus} disabled={!name.trim()}>
          Aggiungi
        </Button>
      </form>

      <Button size="lg" className="mt-3" disabled={present.length < 2} onClick={onNext}>
        {present.length < 2 ? "Servono almeno 2 persone" : `Avanti · ${present.length} presenti`}
      </Button>
    </div>
  );
}

function OddsList({
  odds,
  state,
  today,
  setToday,
}: {
  odds: Odds[];
  state: State;
  today: Today;
  setToday: React.Dispatch<React.SetStateAction<Today>>;
}) {
  const byId = new Map(state.friends.map((f) => [f.id, f]));
  const max = Math.max(...odds.map((o) => o.p));

  return (
    <section>
      <SectionHeader>Probabilità</SectionHeader>
      <p className="-mt-1 px-1 pb-3 text-footnote text-label-2">
        Segna chi ha portato la macchina e chi prende un extra: le percentuali si aggiornano subito.
      </p>
      <ul className="flex flex-col gap-2">
        {odds.map((o) => {
          const f = byId.get(o.id);
          if (!f) return null;
          const parts = [`saldo ${signed(o.balance)}`];
          if (o.extra) parts.push(`extra ${signed(o.extra)}`);
          if (o.car) parts.push(`${o.car < 0 ? "macchina" : "passaggio"} ${signed(o.car)}`);
          return (
            <li key={o.id}>
              <Glass className="rounded-2xl p-3">
                <div className="flex items-center gap-2.5">
                  <Avatar friend={f} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-headline">{f.name}</div>
                    <div className="truncate text-caption text-label-2">{parts.join(" · ")}</div>
                  </div>
                  <span className="text-title-3 tabular-nums">{percent(o.p)}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill">
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${(o.p / max) * 100}%`, background: f.color }} />
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  <Toggle
                    on={today.drivers.includes(o.id)}
                    onChange={(on) => setToday((t) => ({ ...t, drivers: toggleId(t.drivers, o.id, on) }))}
                    icon={Car}
                    label="Macchina"
                  />
                  <Toggle
                    on={today.extras.includes(o.id)}
                    onChange={(on) => setToday((t) => ({ ...t, extras: toggleId(t.extras, o.id, on) }))}
                    icon={CakeSlice}
                    label="Extra"
                  />
                </div>
              </Glass>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
