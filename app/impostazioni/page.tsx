"use client";

import { useRef, useState } from "react";
import { Download, Plus, RotateCcw, Upload, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { FriendSheet } from "@/components/FriendSheet";
import { RulesForm } from "@/components/RulesForm";
import { confirmAlert } from "@/components/ui/Alert";
import { IconTile, ListRow, ListSection } from "@/components/ui/List";
import { Switch } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toast";
import { actions } from "@/lib/store";
import type { Friend, State } from "@/lib/types";

export default function ImpostazioniPage() {
  return <AppShell title="Regole">{(state) => <Impostazioni state={state} />}</AppShell>;
}

function Impostazioni({ state }: { state: State }) {
  const [editing, setEditing] = useState<Friend | "new" | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const counts = new Map<string, number>();
  for (const s of state.sessions) for (const id of s.present) counts.set(id, (counts.get(id) ?? 0) + 1);
  const activeCount = state.friends.filter((f) => f.active).length;

  const exportBackup = () => {
    const blob = new Blob([actions.exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ipagato-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup esportato");
  };

  const importBackup = async (f: File) => {
    const ok = await confirmAlert({
      title: "Importare il backup?",
      message: "Sostituisce amici, storico e regole di questo telefono.",
      confirmLabel: "Importa",
      destructive: true,
    });
    if (!ok) return;
    try {
      actions.importJson(await f.text());
      toast("Backup importato");
    } catch {
      toast("File non valido: nessuna modifica");
    }
  };

  return (
    <>
      <ListSection header={`Gruppo · ${activeCount} attivi`} footer="Tocca un nome per rinominarlo o toglierlo dalle estrazioni.">
        {state.friends.map((f) => (
          <ListRow
            key={f.id}
            leading={<Avatar friend={f} size={30} className={f.active ? "" : "opacity-40 grayscale"} />}
            title={<span className={f.active ? "" : "text-label-2"}>{f.name}</span>}
            trailing={
              <span className="text-subhead text-label-2">{f.active ? `${counts.get(f.id) ?? 0} caffè` : "Non partecipa"}</span>
            }
            onClick={() => setEditing(f)}
            chevron
          />
        ))}
        <ListRow
          leading={
            <span className="flex size-[30px] items-center justify-center rounded-full bg-accent-soft text-accent">
              <Plus className="size-5" strokeWidth={2.4} />
            </span>
          }
          title="Aggiungi amico"
          tone="accent"
          onClick={() => setEditing("new")}
        />
      </ListSection>

      <RulesForm settings={state.settings} onChange={actions.updateSettings} />

      <ListSection header="Esperienza">
        <ListRow
          leading={<IconTile icon={Volume2} color="#FF2D55" />}
          title="Suoni e vibrazione"
          trailing={<Switch on={state.settings.sound} onChange={(sound) => actions.updateSettings({ sound })} label="Suoni e vibrazione" />}
        />
      </ListSection>

      <ListSection header="Dati" footer="Amici e storico sono salvati solo su questo telefono. Esporta un backup ogni tanto, o per passarli a un altro telefono.">
        <ListRow leading={<IconTile icon={Download} color="#34C759" />} title="Esporta backup" onClick={exportBackup} chevron />
        <ListRow leading={<IconTile icon={Upload} color="#007AFF" />} title="Importa backup" onClick={() => file.current?.click()} chevron />
      </ListSection>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void importBackup(f);
        }}
      />

      <ListSection>
        <ListRow
          tone="destructive"
          leading={<RotateCcw className="size-5 text-red" />}
          inset={16}
          title="Azzera tutto"
          onClick={async () => {
            const ok = await confirmAlert({
              title: "Azzerare tutto?",
              message: "Amici, storico e regole verranno cancellati. Non si può annullare.",
              confirmLabel: "Azzera",
              destructive: true,
            });
            if (ok) actions.reset();
          }}
        />
      </ListSection>

      <p className="pt-6 text-center text-footnote text-label-3">iPagato · offre la ruota, decide l&apos;equità</p>

      {editing && (
        <FriendSheet friend={editing === "new" ? undefined : editing} state={state} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
