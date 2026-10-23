"use client";

import { useEffect, useMemo, useState } from "react";
import { CakeSlice, Car, Check, ChevronLeft, Coffee, Dices, Plus, Undo2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { fireConfetti } from "@/components/Confetti";
import { FriendSheet } from "@/components/FriendSheet";
import { ResultCard } from "@/components/ResultCard";
import { Wheel } from "@/components/Wheel";
import { BottomBar } from "@/components/ui/BottomBar";
import { Button } from "@/components/ui/Button";
import { ContentUnavailable } from "@/components/ui/ContentUnavailable";
import { IconToggle } from "@/components/ui/IconToggle";
import { ListRow, ListSection } from "@/components/ui/List";
import { todayOdds, type Odds } from "@/lib/fairness";
import { chime, haptic, setFeedbackEnabled, tick, unlockAudio } from "@/lib/feedback";
import { clock, percent, sameDay, signed } from "@/lib/format";
import { useTween } from "@/lib/hooks";
import { toggleId } from "@/lib/list";
import { pickWeighted, secureRandom } from "@/lib/random";
import { actions } from "@/lib/store";
import type { Friend, State, Today } from "@/lib/types";
import { layoutSlices, targetRotation, type Slice } from "@/lib/wheel";

const todayLabel = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

export default function OggiPage() {
  return (
    <AppShell title="Oggi" subtitle={todayLabel.format(new Date())}>
      {(state) => <Oggi state={state} />}
    </AppShell>
  );
}

type Mode = "home" | "presenti" | "ruota";

interface Spin {
  slices: Slice[];
  sessionId: string;
  winnerId: string;
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

  useEffect(() => {
    setFeedbackEnabled(state.settings.sound);
  }, [state.settings.sound]);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [mode]);

  const odds = useMemo(() => todayOdds(state.sessions, today, state.settings), [state.sessions, today, state.settings]);
  const liveSlices = useMemo(
    () => layoutSlices(odds.map((o) => ({ id: o.id, label: byId.get(o.id)?.name ?? "?", color: byId.get(o.id)?.color ?? "#999", p: o.p }))),
    [odds, byId],
  );
  const spinSession = spin && state.sessions.find((s) => s.id === spin.sessionId);
  const winner = spin?.done ? byId.get(spin.winnerId) : undefined;

  const go = (base: number) => {
    unlockAudio();
    haptic();
    const i = pickWeighted(odds.map((o) => o.p));
    // L'estrazione si salva subito: chiudere l'app a metà giro non la annulla
    const sessionId = actions.addSession({
      date: new Date().toISOString(),
      ...today,
      payerId: odds[i].id,
      odds: Object.fromEntries(odds.map((o) => [o.id, o.p])),
    });
    setSpin({ slices: liveSlices, sessionId, winnerId: odds[i].id, done: false });
    setRotation(targetRotation(liveSlices[i], base, secureRandom));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onSpinEnd = () => {
    if (!spin || spin.done) return;
    setSpin({ ...spin, done: true });
    chime();
    haptic("success");
    fireConfetti([byId.get(spin.winnerId)?.color ?? "#8a4a1f", "#d0844f", "#f1c9a2", "#ffd60a", "#ffffff"]);
  };

  const newDraw = () => {
    // Stessi presenti, ma macchina ed extra si risegnano
    setToday((t) => ({ ...t, drivers: [], extras: [] }));
    setSpin(null);
    setMode("presenti");
  };

  // ---------------------------------------------------------------- home
  if (mode === "home") {
    const [latest, ...earlier] = todaySessions;
    return (
      <>
        {latest ? (
          <ResultCard key={latest.id} session={latest} state={state} />
        ) : (
          <ContentUnavailable icon={Coffee} title="Nessuna estrazione oggi" description="Gira la ruota per scoprire chi offre." />
        )}
        {earlier.length > 0 && (
          <ListSection header="Prima, oggi">
            {earlier.map((s) => {
              const p = byId.get(s.payerId);
              return p ? (
                <ListRow
                  key={s.id}
                  leading={<Avatar friend={p} size={30} />}
                  title={p.name}
                  trailing={<span className="text-subhead text-label-2">{clock(s.date)}</span>}
                />
              ) : null;
            })}
          </ListSection>
        )}
        <BottomBar>
          <Button size="lg" className="w-full" icon={Dices} onClick={newDraw}>
            Nuova estrazione
          </Button>
        </BottomBar>
      </>
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
    <>
      {!spin && <BackButton onClick={() => setMode("presenti")}>Chi c&apos;è</BackButton>}

      <div
        onPointerDown={unlockAudio}
        className={`mx-auto w-full pt-5 transition-[max-width] duration-700 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${spin?.done ? "max-w-[200px]" : "max-w-[340px]"}`}
      >
        <Wheel
          slices={spin ? spin.slices : liveSlices}
          rotation={rotation}
          spinning={spinning}
          interactive={!spin}
          winner={winner}
          onSpinEnd={onSpinEnd}
          onTick={() => {
            tick();
            haptic();
          }}
          onDragEnd={(r, fling) => (fling ? go(r) : setRotation(r))}
        />
      </div>

      {!spin && (
        <>
          <p className="mt-5 text-center text-footnote text-label-2">Trascina la ruota in senso orario, o premi Gira</p>
          <OddsSection odds={odds} byId={byId} today={today} setToday={setToday} />
          <BottomBar>
            <Button size="lg" className="w-full" icon={Dices} onClick={() => go(rotation)}>
              Gira la ruota
            </Button>
          </BottomBar>
        </>
      )}

      {spinning && (
        <p className="mt-8 animate-pulse text-center text-title-3 text-label-2" aria-live="polite">
          Gira, gira…
        </p>
      )}

      {spin?.done && spinSession && (
        <>
          <div className="mt-6">
            <ResultCard session={spinSession} state={state} fresh />
          </div>
          <BottomBar>
            <Button size="lg" className="w-full" icon={Check} onClick={() => setMode("home")}>
              Fatto
            </Button>
          </BottomBar>
        </>
      )}
      {spin?.done && !spinSession && (
        <ContentUnavailable
          icon={Undo2}
          title="Estrazione annullata"
          description="Non conta nei saldi."
          action={
            <Button icon={Dices} onClick={() => setSpin(null)}>
              Gira di nuovo
            </Button>
          }
        />
      )}
    </>
  );
}

function BackButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="-ml-2 -mt-1 inline-flex h-11 items-center pr-3 text-body text-accent">
      <ChevronLeft className="size-[26px]" strokeWidth={2.4} aria-hidden />
      {children}
    </button>
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
  const [adding, setAdding] = useState(false);
  const active = state.friends.filter((f) => f.active);
  const all = present.length === active.length;

  return (
    <>
      {onBack && <BackButton onClick={onBack}>Oggi</BackButton>}
      <div className="flex items-end justify-between gap-3 px-1 pb-5 pt-2">
        <div>
          <h2 className="text-title-2">Chi c&apos;è oggi?</h2>
          <p className="text-subhead text-label-2">
            {present.length} di {active.length} · tocca per cambiare
          </p>
        </div>
        <button
          className="h-11 px-1 text-body text-accent"
          onClick={() => {
            haptic();
            onChange(all ? [] : active.map((f) => f.id));
          }}
        >
          {all ? "Nessuno" : "Tutti"}
        </button>
      </div>

      <div className="stagger grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-4">
        {active.map((f) => (
          <PersonBubble
            key={f.id}
            friend={f}
            on={present.includes(f.id)}
            onToggle={(on) => {
              haptic();
              onChange(toggleId(present, f.id, on));
            }}
          />
        ))}
        <button onClick={() => setAdding(true)} className="glass-button flex flex-col items-center gap-2">
          <span className="flex size-[74px] items-center justify-center rounded-full border-2 border-dashed border-label-3 text-label-2">
            <Plus className="size-7" strokeWidth={2} aria-hidden />
          </span>
          <span className="text-subhead font-semibold text-label-2">Aggiungi</span>
        </button>
      </div>

      {adding && <FriendSheet state={state} onClose={() => setAdding(false)} onAdded={(id) => onChange([...present, id])} />}

      <BottomBar>
        <Button size="lg" className="w-full" disabled={present.length < 2} onClick={onNext}>
          {present.length < 2 ? "Scegli almeno 2 persone" : `Continua con ${present.length}`}
        </Button>
      </BottomBar>
    </>
  );
}

function PersonBubble({ friend, on, onToggle }: { friend: Friend; on: boolean; onToggle: (on: boolean) => void }) {
  return (
    <button aria-pressed={on} onClick={() => onToggle(!on)} className="glass-button flex min-w-0 flex-col items-center gap-2">
      <span className="relative">
        <span className={`block rounded-full p-[3px] transition-shadow duration-200 ${on ? "shadow-[0_0_0_2.5px_var(--accent)]" : ""}`}>
          <Avatar friend={friend} size={68} className={`transition-[opacity,filter] duration-200 ${on ? "" : "opacity-35 grayscale"}`} />
        </span>
        <span
          className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-accent text-on-accent ring-[2.5px] ring-[var(--bg)] transition-[transform,opacity] duration-300"
          style={{ transform: on ? "scale(1)" : "scale(0.4)", opacity: on ? 1 : 0, transitionTimingFunction: "cubic-bezier(0.3, 1.6, 0.5, 1)" }}
          aria-hidden
        >
          <Check className="size-3.5" strokeWidth={3.4} />
        </span>
      </span>
      <span className={`max-w-full truncate text-subhead font-semibold transition-colors ${on ? "text-label" : "text-label-3"}`}>{friend.name}</span>
    </button>
  );
}

function OddsSection({
  odds,
  byId,
  today,
  setToday,
}: {
  odds: Odds[];
  byId: Map<string, Friend>;
  today: Today;
  setToday: React.Dispatch<React.SetStateAction<Today>>;
}) {
  const max = Math.max(...odds.map((o) => o.p));
  return (
    <ListSection
      header="Probabilità di oggi"
      footer={
        <>
          <Car className="inline size-3.5 -translate-y-px text-blue" aria-hidden /> chi ha portato la macchina,{" "}
          <CakeSlice className="inline size-3.5 -translate-y-px text-orange" aria-hidden /> chi prende un extra. Il saldo è caffè bevuti meno caffè pagati.
        </>
      }
    >
      {odds.map((o) => {
        const f = byId.get(o.id);
        if (!f) return null;
        // Saldo fino a ieri e, se oggi macchina o extra lo spostano, dove arriva
        const adjusted = o.extra || o.car ? ` → ${signed(o.score)}` : "";
        return (
          <ListRow
            key={o.id}
            leading={<Avatar friend={f} size={36} />}
            title={<span className="font-semibold">{f.name}</span>}
            subtitle={`Saldo ${signed(o.balance)}${adjusted}`}
            inset={64}
            trailing={
              <div className="flex items-center gap-1.5">
                <IconToggle
                  tone="blue"
                  icon={Car}
                  label={`${f.name} ha la macchina`}
                  on={today.drivers.includes(o.id)}
                  onChange={(on) => {
                    haptic();
                    setToday((t) => ({ ...t, drivers: toggleId(t.drivers, o.id, on) }));
                  }}
                />
                <IconToggle
                  tone="orange"
                  icon={CakeSlice}
                  label={`${f.name} prende un extra`}
                  on={today.extras.includes(o.id)}
                  onChange={(on) => {
                    haptic();
                    setToday((t) => ({ ...t, extras: toggleId(t.extras, o.id, on) }));
                  }}
                />
                <Percent p={o.p} />
              </div>
            }
          >
            <div className="-mt-1.5 mb-2.5 ml-[64px] mr-4 h-[3px] overflow-hidden rounded-full bg-fill" aria-hidden>
              <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${(o.p / max) * 100}%`, background: f.color }} />
            </div>
          </ListRow>
        );
      })}
    </ListSection>
  );
}

function Percent({ p }: { p: number }) {
  const shown = useTween(p);
  return <span className="font-rounded w-[52px] text-right text-title-3 font-semibold">{percent(shown)}</span>;
}
