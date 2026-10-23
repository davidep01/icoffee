import { describe, expect, it } from "vitest";
import { BETA, DEFAULT_SETTINGS, carShares, ledger, softmax, todayOdds } from "@/lib/fairness";
import { pickWeighted } from "@/lib/random";
import type { Fairness, Session, Settings } from "@/lib/types";

const S: Settings = DEFAULT_SETTINGS;

function session(p: Partial<Session> & Pick<Session, "present" | "payerId">): Session {
  return { id: Math.random().toString(36), date: "2026-10-23T12:00:00Z", drivers: [], extras: [], odds: {}, ...p };
}

/** PRNG deterministico per le simulazioni. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("ledger", () => {
  it("chi paga va in credito, gli altri in debito", () => {
    const book = ledger([session({ present: ["a", "b", "c"], payerId: "a" })], S);
    expect(book.a.balance).toBe(-2);
    expect(book.b.balance).toBe(1);
    expect(book.c.balance).toBe(1);
    expect(book.a.given).toBe(2);
    expect(book.a.paidTimes).toBe(1);
  });

  it("l'extra pesa su chi lo prende", () => {
    const book = ledger([session({ present: ["a", "b", "c"], payerId: "a", extras: ["b"] })], S);
    expect(book.a.balance).toBe(-3);
    expect(book.b.balance).toBe(2);
    expect(book.c.balance).toBe(1);
    expect(book.b.extras).toBe(1);
  });

  it("l'extra di chi paga non cambia nulla per lui", () => {
    const book = ledger([session({ present: ["a", "b"], payerId: "a", extras: ["a"] })], S);
    expect(book.a.balance).toBe(-1);
    expect(book.a.given).toBe(1);
  });

  it("la macchina dà credito all'autista, pagato dai passeggeri", () => {
    const book = ledger([session({ present: ["a", "b", "c"], payerId: "a", drivers: ["c"] })], S);
    expect(book.c.balance).toBe(0);
    expect(book.b.balance).toBe(1.5);
    expect(book.a.balance).toBe(-1.5);
    expect(book.c.drives).toBe(1);
  });

  it("i saldi sommano sempre a zero", () => {
    const book = ledger(
      [
        session({ present: ["a", "b", "c", "d"], payerId: "b", drivers: ["a", "d"], extras: ["c", "d"] }),
        session({ present: ["a", "c"], payerId: "c", drivers: ["a"] }),
        session({ present: ["b", "d"], payerId: "d", drivers: ["b", "d"] }),
      ],
      { extraValue: 1.5, carBonus: 2, fairness: "media" },
    );
    expect(sum(Object.values(book).map((x) => x.balance))).toBeCloseTo(0, 10);
  });

  it("modificare un extra dopo l'estrazione aggiorna i saldi", () => {
    const s = session({ present: ["a", "b"], payerId: "a" });
    expect(ledger([s], S).b.balance).toBe(1);
    expect(ledger([{ ...s, extras: ["b"] }], S).b.balance).toBe(2);
  });
});

describe("carShares", () => {
  it("se guidano tutti nessuno ci guadagna", () => {
    expect(carShares(["a", "b"], ["a", "b"], S)).toEqual({});
  });
  it("più autisti dividono il costo tra i passeggeri", () => {
    expect(carShares(["a", "b", "c", "d"], ["a", "b"], S)).toEqual({ a: -1, b: -1, c: 1, d: 1 });
  });
});

describe("softmax", () => {
  it("somma 1 e senza equità è uniforme", () => {
    expect(sum(softmax([3, -2, 0, 7], 0.8))).toBeCloseTo(1, 12);
    for (const p of softmax([3, -2, 0, 7], 0)) expect(p).toBeCloseTo(0.25, 12);
  });
  it("più debito, più probabilità; nessuno a zero", () => {
    const [low, mid, high] = softmax([-40, 0, 40], 1.5);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(low).toBeGreaterThan(0);
  });
  it("un caffè di debito moltiplica le chance di e^β", () => {
    const [a, b] = softmax([1, 0], BETA.media);
    expect(a / b).toBeCloseTo(Math.exp(BETA.media), 10);
  });
});

describe("todayOdds", () => {
  it("chi ha appena pagato per tutti esce di rado", () => {
    const odds = todayOdds([session({ present: ["a", "b", "c", "d", "e"], payerId: "a" })], { present: ["a", "b", "c", "d", "e"], drivers: [], extras: [] }, S);
    const a = odds.find((o) => o.id === "a")!;
    expect(a.balance).toBe(-4);
    expect(a.p).toBeLessThan(0.01);
    expect(sum(odds.map((o) => o.p))).toBeCloseTo(1, 12);
  });

  it("extra di oggi alza, macchina di oggi abbassa", () => {
    const odds = todayOdds([], { present: ["a", "b", "c"], drivers: ["c"], extras: ["a"] }, S);
    const [a, b, c] = odds;
    expect(a.p).toBeGreaterThan(b.p);
    expect(c.p).toBeLessThan(b.p);
    expect(a.extra).toBe(1);
    expect(c.car).toBe(-1);
  });

  it("un amico nuovo parte da zero", () => {
    const odds = todayOdds([session({ present: ["a", "b"], payerId: "a" })], { present: ["a", "b", "z"], drivers: [], extras: [] }, S);
    expect(odds.find((o) => o.id === "z")!.balance).toBe(0);
  });
});

describe("pickWeighted", () => {
  it("rispetta i pesi", () => {
    const rand = mulberry32(7);
    const hits = [0, 0, 0];
    for (let i = 0; i < 30000; i++) hits[pickWeighted([0.2, 0.5, 0.3], rand)]++;
    expect(hits[0] / 30000).toBeCloseTo(0.2, 1);
    expect(hits[1] / 30000).toBeCloseTo(0.5, 1);
    expect(hits[2] / 30000).toBeCloseTo(0.3, 1);
  });
});

/**
 * 800 pranzi con presenze, extra e autisti casuali: con l'equità i saldi
 * restano piccoli (ognuno paga circa quanto consuma), con la sola fortuna no.
 */
function simulate(fairness: Fairness, seed = 42, days = 800) {
  const rand = mulberry32(seed);
  const people = ["a", "b", "c", "d", "e", "f"];
  const attendance = [0.95, 0.9, 0.75, 0.5, 0.3, 0.8];
  const extraRate = [0.1, 0.4, 0.2, 0.05, 0.3, 0.15];
  const settings: Settings = { ...S, fairness };
  const sessions: Session[] = [];
  let worst = 0;

  for (let d = 0; d < days; d++) {
    const present = people.filter((_, i) => rand() < attendance[i]);
    if (present.length < 2) continue;
    const extras = present.filter((id) => rand() < extraRate[people.indexOf(id)]);
    const drivers = [present[Math.floor(rand() * present.length)]];
    const odds = todayOdds(sessions, { present, drivers, extras }, settings);
    const payerId = odds[pickWeighted(odds.map((o) => o.p), rand)].id;
    sessions.push(session({ present, drivers, extras, payerId }));
    if (d > 50) worst = Math.max(worst, ...odds.map((o) => Math.abs(o.balance)));
  }
  return { book: ledger(sessions, settings), worst };
}

describe("simulazione", () => {
  it("con equità media nessuno resta indietro di molto", () => {
    const { book, worst } = simulate("media");
    expect(worst).toBeLessThan(12);
    // Chi consuma di più paga di più: pagato ≈ consumato (scarto < 3%)
    for (const st of Object.values(book)) {
      expect(Math.abs(st.balance) / st.consumed).toBeLessThan(0.03);
    }
  });

  it("l'equità alta è più stretta di quella bassa, la fortuna diverge", () => {
    const alta = simulate("alta").worst;
    const bassa = simulate("bassa").worst;
    const fortuna = simulate("fortuna").worst;
    expect(alta).toBeLessThan(bassa);
    expect(bassa * 3).toBeLessThan(fortuna);
  });
});
