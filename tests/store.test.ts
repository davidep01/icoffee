import { describe, expect, it } from "vitest";
import { ledger, DEFAULT_SETTINGS } from "@/lib/fairness";
import { stateSchema } from "@/lib/store";

const session = { id: "s1", date: "2026-10-20T12:00:00Z", present: ["a", "b"], drivers: [], extras: [], payerId: "a", odds: {} };
const backup = (sessions: object[], settings: object = { extraValue: 1, carBonus: 1, fairness: "media" }) => ({
  version: 1,
  friends: [
    { id: "a", name: "Anna", color: "#000", active: true },
    { id: "b", name: "Bruno", color: "#000", active: true },
  ],
  sessions,
  settings,
});

describe("backup", () => {
  it("accetta i backup della prima versione (senza suoni né pagamenti a mano)", () => {
    const s = stateSchema.parse(backup([session]));
    expect(s.settings.sound).toBe(true);
    expect(s.sessions[0].manual).toBeUndefined();
  });

  it("un pagamento a mano conta nei saldi come un'estrazione", () => {
    const s = stateSchema.parse(backup([{ ...session, manual: true }]));
    expect(s.sessions[0].manual).toBe(true);
    const book = ledger(s.sessions, DEFAULT_SETTINGS);
    expect(book.a.balance).toBe(-1);
    expect(book.b.balance).toBe(1);
  });
});
