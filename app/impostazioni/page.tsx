"use client";

import { useRef, useState } from "react";
import { Download, Plus, RotateCcw, Trash2, Upload, UserPlus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { RulesForm } from "@/components/RulesForm";
import { Button } from "@/components/ui/Button";
import { Glass, SectionHeader } from "@/components/ui/Glass";
import { actions } from "@/lib/store";
import type { State } from "@/lib/types";

export default function ImpostazioniPage() {
  return <AppShell title="Regole">{(state) => <Impostazioni state={state} />}</AppShell>;
}

function Impostazioni({ state }: { state: State }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const used = new Set(state.sessions.flatMap((s) => [...s.present, s.payerId]));

  const exportBackup = () => {
    const blob = new Blob([actions.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ipagato-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importBackup = async (f: File) => {
    if (!confirm("Importare il backup? Sostituisce tutti i dati di questo telefono.")) return;
    try {
      actions.importJson(await f.text());
      setMessage("Backup importato.");
    } catch {
      setMessage("File non valido: nessuna modifica.");
    }
  };

  return (
    <>
      <SectionHeader>Amici</SectionHeader>
      <Glass className="rounded-2xl p-2">
        <ul className="flex flex-col">
          {state.friends.map((f) => (
            <li key={f.id} className="flex items-center gap-2.5 border-b border-separator p-2 last:border-0">
              <Avatar friend={f} size={32} />
              <input
                key={f.name}
                defaultValue={f.name}
                maxLength={40}
                aria-label={`Nome di ${f.name}`}
                onBlur={(e) => {
                  const n = e.target.value.trim();
                  if (n && n !== f.name) actions.updateFriend(f.id, { name: n });
                  else e.target.value = f.name;
                }}
                className={`min-w-0 flex-1 rounded-lg bg-transparent px-1 py-1 text-body outline-none focus:bg-fill ${f.active ? "" : "text-label-3"}`}
              />
              <button
                onClick={() => actions.updateFriend(f.id, { active: !f.active })}
                className={`glass-button h-8 rounded-full px-3 text-footnote font-semibold ${f.active ? "bg-green-soft text-green" : "bg-fill text-label-2"}`}
              >
                {f.active ? "Attivo" : "Non attivo"}
              </button>
              {!used.has(f.id) && (
                <button
                  aria-label={`Elimina ${f.name}`}
                  onClick={() => confirm(`Eliminare ${f.name}?`) && actions.removeFriend(f.id)}
                  className="glass-button flex size-8 items-center justify-center rounded-full bg-red-soft text-red"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            actions.addFriend(name.trim());
            setName("");
          }}
        >
          <label className="flex h-10 flex-1 items-center gap-2 rounded-full bg-fill px-4">
            <UserPlus className="size-4 text-label-3" aria-hidden />
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              placeholder="Nuovo amico"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-label-3"
            />
          </label>
          <Button type="submit" size="sm" variant="tinted" icon={Plus} disabled={!name.trim()} className="h-10">
            Aggiungi
          </Button>
        </form>
      </Glass>
      <p className="px-1 pt-2 text-footnote text-label-2">Chi ha già un&apos;estrazione nello storico si può solo disattivare.</p>

      <SectionHeader>Algoritmo</SectionHeader>
      <RulesForm settings={state.settings} onChange={actions.updateSettings} />

      <SectionHeader>Backup</SectionHeader>
      <Glass className="flex flex-col gap-3 rounded-2xl p-4">
        <p className="text-footnote text-label-2">
          I dati sono salvati solo su questo telefono. Esporta un backup ogni tanto, o per passarli a un altro telefono.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="tinted" icon={Download} onClick={exportBackup}>
            Esporta
          </Button>
          <Button variant="tinted" icon={Upload} onClick={() => file.current?.click()}>
            Importa
          </Button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importBackup(f);
              e.target.value = "";
            }}
          />
        </div>
        {message && <p className="text-footnote font-semibold text-accent">{message}</p>}
      </Glass>

      <SectionHeader>Ricomincia</SectionHeader>
      <Button
        variant="destructive"
        icon={RotateCcw}
        onClick={() => confirm("Cancellare amici, storico e regole? Non si può annullare.") && actions.reset()}
      >
        Azzera tutto
      </Button>
    </>
  );
}
