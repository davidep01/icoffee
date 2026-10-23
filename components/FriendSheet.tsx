"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { confirmAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ListRow, ListSection } from "@/components/ui/List";
import { Sheet, SheetAction } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { actions, nextColor } from "@/lib/store";
import type { Friend, State } from "@/lib/types";

/** Aggiungere un amico o modificarne nome e partecipazione. */
export function FriendSheet({
  friend,
  state,
  onClose,
  onAdded,
}: {
  friend?: Friend;
  state: State;
  onClose: () => void;
  onAdded?: (id: string) => void;
}) {
  const [name, setName] = useState(friend?.name ?? "");
  const [active, setActive] = useState(friend?.active ?? true);
  const trimmed = name.trim();
  const duplicate = state.friends.some((f) => f.id !== friend?.id && f.name.toLowerCase() === trimmed.toLowerCase());
  const used = friend && state.sessions.some((s) => s.present.includes(friend.id) || s.payerId === friend.id);
  const color = friend?.color ?? nextColor(state.friends);

  const save = () => {
    if (friend) actions.updateFriend(friend.id, { name: trimmed, active });
    else onAdded?.(actions.addFriend(trimmed));
  };

  return (
    <Sheet
      onClose={onClose}
      title={friend ? "Modifica amico" : "Nuovo amico"}
      footer={
        <SheetAction onPress={save}>
          {(press) => (
            <Button size="lg" className="w-full" disabled={!trimmed || duplicate} onClick={press}>
              {friend ? "Salva" : "Aggiungi"}
            </Button>
          )}
        </SheetAction>
      }
    >
      <SheetAction onPress={save}>
        {(press) => (
      <form
        className="flex flex-col items-center gap-4 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (trimmed && !duplicate) press();
        }}
      >
        <Avatar friend={{ name: trimmed || "?", color }} size={84} />
        <input
          autoFocus={!friend}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          placeholder="Nome"
          enterKeyHint="done"
          autoCapitalize="words"
          aria-label="Nome"
          className="h-12 w-full rounded-[14px] bg-fill px-4 text-center text-title-3 outline-none placeholder:text-label-3 focus:bg-fill-2"
        />
        {duplicate && <p className="-mt-2 text-footnote font-semibold text-red">C&apos;è già qualcuno con questo nome.</p>}
      </form>
        )}
      </SheetAction>

      {friend && (
        <>
          <ListSection footer="Chi non partecipa resta nello storico e nei saldi, ma non compare tra i presenti.">
            <ListRow title="Partecipa alle estrazioni" trailing={<Switch on={active} onChange={setActive} label="Partecipa alle estrazioni" />} />
          </ListSection>
          {used ? (
            <p className="px-4 pt-6 text-center text-footnote text-label-2">
              {friend.name} ha già delle estrazioni: per toglierlo dal gruppo disattivalo.
            </p>
          ) : (
            <ListSection>
              <SheetAction onPress={() => actions.removeFriend(friend.id)}>
                {(press) => (
                  <ListRow
                    tone="destructive"
                    leading={<Trash2 className="size-5 text-red" />}
                    inset={16}
                    title="Elimina amico"
                    onClick={async () => {
                      const ok = await confirmAlert({
                        title: `Eliminare ${friend.name}?`,
                        message: "Non ha ancora estrazioni, quindi non cambia nessun saldo.",
                        confirmLabel: "Elimina",
                        destructive: true,
                      });
                      if (ok) press();
                    }}
                  />
                )}
              </SheetAction>
            </ListSection>
          )}
        </>
      )}
    </Sheet>
  );
}
