import { toast } from "@/components/ui/Toast";
import { percent } from "@/lib/format";
import { actions } from "@/lib/store";
import type { Session, State } from "@/lib/types";

/** Niente conferma: si elimina subito e si può annullare dal toast, come in Mail. */
export function deleteSessionWithUndo(session: Session) {
  actions.deleteSession(session.id);
  toast("Estrazione eliminata", { label: "Annulla", onPress: () => actions.restoreSession(session) });
}

export async function shareResult(session: Session, state: State) {
  const name = state.friends.find((f) => f.id === session.payerId)?.name ?? "?";
  const odds = session.manual ? "" : ` (aveva il ${percent(session.odds[session.payerId] ?? 0)} di probabilità)`;
  const text = `☕ Oggi offre ${name}!${odds} — iPagato`;
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast("Copiato negli appunti");
  } catch {
    // Condivisione annullata dall'utente
  }
}
