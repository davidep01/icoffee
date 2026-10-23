"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Coffee, Plus, Upload, X } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { RulesForm } from "@/components/RulesForm";
import { Button } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { DEFAULT_SETTINGS } from "@/lib/fairness";
import { COLORS, actions, useAppState } from "@/lib/store";
import type { Settings } from "@/lib/types";

const STEPS = ["Amici", "Regole", "Pronti"];

/** Wizard del primo avvio: chi beve il caffè e con quali regole. */
export default function SetupPage() {
  const state = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [names, setNames] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  // Già configurato (o backup appena importato): si va alla ruota
  useEffect(() => {
    if (state && state.friends.length > 0) router.replace("/");
  }, [state, router]);

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (names.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setError(`${n} c'è già.`);
      return;
    }
    setNames((xs) => [...xs, n]);
    setName("");
    setError(null);
  };

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-8">
      <header className="flex flex-col items-center pt-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-[20px] bg-accent text-on-accent shadow-[0_14px_30px_-10px_var(--accent)]">
          <Coffee className="size-9" strokeWidth={2.2} />
        </div>
        <h1 className="text-large-title mt-4">iPagato</h1>
        <p className="text-subhead text-label-2">Chi offre il caffè oggi? Lo decide la ruota, con giustizia.</p>
        <ol className="mt-6 flex gap-2" aria-label="Passi">
          {STEPS.map((s, i) => (
            <li
              key={s}
              aria-current={i === step ? "step" : undefined}
              className={`rounded-full px-3 py-1 text-footnote font-semibold ${i === step ? "bg-accent text-on-accent" : i < step ? "bg-accent-soft text-accent" : "bg-fill text-label-2"}`}
            >
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </header>

      <section className="mt-8 flex-1">
        {step === 0 && (
          <div className="animate-rise flex flex-col gap-3">
            <h2 className="text-title-2">Chi beve il caffè?</h2>
            <p className="-mt-2 text-subhead text-label-2">Inserisci tutto il gruppo. Ogni giorno sceglierai chi c&apos;è.</p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="Nome"
                className="h-12 min-w-0 flex-1 rounded-2xl bg-fill px-4 text-body outline-none placeholder:text-label-3 focus:bg-fill-2"
              />
              <Button type="submit" size="lg" icon={Plus} disabled={!name.trim()}>
                Aggiungi
              </Button>
            </form>
            {error && <p className="text-footnote font-semibold text-red">{error}</p>}
            {names.length > 0 && (
              <Glass className="rounded-2xl p-2">
                <ul>
                  {names.map((n, i) => (
                    <li key={n} className="flex items-center gap-2.5 border-b border-separator p-2 last:border-0">
                      <Avatar friend={{ name: n, color: COLORS[i % COLORS.length] }} size={32} />
                      <span className="flex-1 truncate text-headline">{n}</span>
                      <button
                        aria-label={`Togli ${n}`}
                        onClick={() => setNames((xs) => xs.filter((x) => x !== n))}
                        className="glass-button flex size-8 items-center justify-center rounded-full bg-fill text-label-2"
                      >
                        <X className="size-4" strokeWidth={2.6} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Glass>
            )}
            <button onClick={() => file.current?.click()} className="mt-2 inline-flex items-center gap-1.5 self-center text-subhead font-semibold text-accent">
              <Upload className="size-4" /> Ho già un backup
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (!f) return;
                try {
                  actions.importJson(await f.text());
                } catch {
                  setError("Backup non valido.");
                }
              }}
            />
          </div>
        )}

        {step === 1 && (
          <div className="animate-rise flex flex-col gap-3">
            <h2 className="text-title-2">Le regole</h2>
            <p className="-mt-2 text-subhead text-label-2">Vanno bene così per iniziare; si cambiano quando vuoi.</p>
            <RulesForm settings={settings} onChange={(p) => setSettings((s) => ({ ...s, ...p }))} />
          </div>
        )}

        {step === 2 && (
          <div className="animate-rise flex flex-col gap-3">
            <h2 className="text-title-2">Come funziona</h2>
            <Glass className="rounded-2xl p-4 text-subhead text-label-2">
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li>Ogni giorno segni chi c&apos;è, chi ha portato la macchina e chi prende un extra.</li>
                <li>Giri la ruota: gli spicchi sono grandi quanto la probabilità di pagare di ognuno.</li>
                <li>
                  Chi ha consumato più di quanto ha offerto ha più probabilità; chi ha appena pagato per tutti quasi nessuna. Ma è
                  sempre una lotteria.
                </li>
                <li>Gli extra si possono segnare anche dopo, dallo storico.</li>
              </ol>
            </Glass>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {names.map((n, i) => (
                <span key={n} className="inline-flex items-center gap-1.5 rounded-full bg-fill py-1 pl-1 pr-3 text-subhead font-semibold">
                  <Avatar friend={{ name: n, color: COLORS[i % COLORS.length] }} size={24} />
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <footer className="pb-safe mt-8 flex gap-2">
        {step > 0 && (
          <Button variant="glass" size="lg" icon={ChevronLeft} onClick={() => setStep((s) => s - 1)} aria-label="Indietro" />
        )}
        {step < 2 ? (
          <Button size="lg" className="flex-1" disabled={step === 0 && names.length < 2} onClick={() => setStep((s) => s + 1)}>
            {step === 0 && names.length < 2 ? "Servono almeno 2 amici" : "Avanti"}
          </Button>
        ) : (
          <Button size="lg" className="flex-1" icon={Coffee} onClick={() => actions.setup(names, settings)}>
            Iniziamo
          </Button>
        )}
      </footer>
    </main>
  );
}
