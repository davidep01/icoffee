"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, ChevronLeft, Dices, MinusCircle, Scale, Upload, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { RulesForm } from "@/components/RulesForm";
import { Button } from "@/components/ui/Button";
import { IconTile, ListRow, ListSection } from "@/components/ui/List";
import { toast } from "@/components/ui/Toast";
import { DEFAULT_SETTINGS } from "@/lib/fairness";
import { COLORS, actions, useAppState } from "@/lib/store";
import type { Settings } from "@/lib/types";

const FEATURES = [
  { icon: Users, color: "#8A4A1F", title: "Chi c'è oggi", text: "Ogni pranzo scegli in un tocco chi è al tavolo." },
  { icon: Dices, color: "#FF9500", title: "Gira la ruota", text: "Gli spicchi sono grandi quanto la probabilità di pagare di ognuno." },
  { icon: Scale, color: "#34C759", title: "Equa, non solo fortunata", text: "Chi ha bevuto più di quanto ha offerto esce più spesso." },
  { icon: Car, color: "#007AFF", title: "Macchina ed extra", text: "Chi guida paga meno, chi prende un dolce un po' di più." },
];

/** Benvenuto in stile Apple: presentazione, gruppo, regole. */
export default function SetupPage() {
  const state = useAppState();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [names, setNames] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const file = useRef<HTMLInputElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Già configurato (o backup appena importato): si va alla ruota
  useEffect(() => {
    if (state && state.friends.length > 0) router.replace("/");
  }, [state, router]);

  const goto = (n: number) => {
    setDir(n > step ? "next" : "prev");
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  const trimmed = name.trim();
  const duplicate = names.some((x) => x.toLowerCase() === trimmed.toLowerCase());
  const add = () => {
    if (!trimmed || duplicate) return;
    setNames((xs) => [...xs, trimmed]);
    setName("");
    input.current?.focus();
  };

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-lg flex-col px-5">
      <nav className="flex h-12 items-center">
        {step > 0 && (
          <button onClick={() => goto(step - 1)} className="-ml-2 inline-flex h-11 items-center pr-3 text-body text-accent">
            <ChevronLeft className="size-[26px]" strokeWidth={2.4} aria-hidden />
            Indietro
          </button>
        )}
      </nav>

      <section key={step} className={`flex-1 pb-8 ${dir === "next" ? "animate-next" : "animate-prev"}`}>
        {step === 0 && (
          <div className="flex flex-col items-center pt-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/512.png" alt="" className="size-[96px] rounded-[22px] shadow-[0_16px_36px_-12px_rgb(90_40_10/0.6)]" />
            <h1 className="mt-6 text-[34px] font-bold leading-[40px] tracking-[0.01em]">
              Benvenuto in
              <br />
              <span className="text-accent">iPagato</span>
            </h1>
            <ul className="mt-10 flex w-full flex-col gap-6 text-left">
              {FEATURES.map((f) => (
                <li key={f.title} className="flex items-start gap-4">
                  <IconTile icon={f.icon} color={f.color} />
                  <div>
                    <div className="text-headline">{f.title}</div>
                    <p className="text-subhead text-label-2">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <>
            <h1 className="text-large-title">Chi beve il caffè?</h1>
            <p className="mt-1 text-body text-label-2">Inserisci tutto il gruppo. Ogni giorno sceglierai chi c&apos;è.</p>
            <form
              className="mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <div className="glass flex h-[52px] items-center gap-2 rounded-[16px] pl-4 pr-1.5">
                <input
                  ref={input}
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="Nome"
                  enterKeyHint="next"
                  autoCapitalize="words"
                  aria-label="Nome"
                  className="min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-label-3"
                />
                <Button type="submit" size="sm" disabled={!trimmed || duplicate}>
                  Aggiungi
                </Button>
              </div>
              {duplicate && trimmed && <p className="px-4 pt-2 text-footnote font-semibold text-red">{trimmed} c&apos;è già.</p>}
            </form>

            {names.length > 0 ? (
              <ListSection header={`${names.length} ${names.length === 1 ? "persona" : "persone"}`}>
                {names.map((n, i) => (
                  <ListRow
                    key={n}
                    leading={<Avatar friend={{ name: n, color: COLORS[i % COLORS.length] }} size={30} />}
                    title={n}
                    trailing={
                      <button
                        aria-label={`Togli ${n}`}
                        onClick={() => setNames((xs) => xs.filter((x) => x !== n))}
                        className="-mr-2 flex size-11 items-center justify-center text-red"
                      >
                        <MinusCircle className="size-[22px]" strokeWidth={2.2} />
                      </button>
                    }
                  />
                ))}
              </ListSection>
            ) : (
              <p className="pt-10 text-center text-subhead text-label-3">Ne servono almeno due.</p>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-large-title">Le regole</h1>
            <p className="mt-1 text-body text-label-2">Vanno bene così per iniziare; si cambiano quando vuoi da Regole.</p>
            <div className="mt-2">
              <RulesForm settings={settings} onChange={(p) => setSettings((s) => ({ ...s, ...p }))} />
            </div>
          </>
        )}
      </section>

      <footer className="pb-safe sticky bottom-0 -mx-5 flex flex-col items-center gap-3 bg-gradient-to-t from-[var(--bg)] from-60% to-transparent px-5 pt-6">
        {step === 0 && (
          <>
            <Button size="lg" className="w-full" onClick={() => goto(1)}>
              Continua
            </Button>
            <button onClick={() => file.current?.click()} className="inline-flex h-11 items-center gap-1.5 text-body text-accent">
              <Upload className="size-4" aria-hidden /> Ripristina da un backup
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
                  toast("Backup non valido");
                }
              }}
            />
          </>
        )}
        {step === 1 && (
          <Button size="lg" className="w-full" disabled={names.length < 2} onClick={() => goto(2)}>
            Continua
          </Button>
        )}
        {step === 2 && (
          <Button size="lg" className="w-full" icon={Dices} onClick={() => actions.setup(names, settings)}>
            Inizia
          </Button>
        )}
        <div className="flex gap-2 pb-1" aria-label={`Passo ${step + 1} di 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-5 bg-accent" : "w-2 bg-fill-2"}`} />
          ))}
        </div>
      </footer>
    </main>
  );
}
