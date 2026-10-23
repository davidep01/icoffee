import type { Fairness, Session, Settings, Today } from "./types";

/**
 * Algoritmo di iPagato.
 *
 * Tutto si misura in caffè. Ogni pranzo, chi c'è consuma 1 caffè (+ il valore
 * dell'extra, se l'ha preso) e chi paga versa il totale dei presenti. Chi porta
 * la macchina guadagna un credito, pagato dai passeggeri. Il saldo di ognuno è
 * quanto ha consumato meno quanto ha versato, corretto per la macchina: più è
 * alto, più "deve" al gruppo. La somma dei saldi resta sempre zero.
 *
 * Le probabilità di oggi sono una softmax del saldo (corretto con extra e
 * macchina di oggi): ogni caffè di debito moltiplica le chance di e^β.
 * Nessuno arriva mai allo 0%: resta una lotteria, ma truccata verso l'equità.
 */

/** β per livello di equità: un caffè di debito moltiplica le chance di e^β. */
export const BETA: Record<Fairness, number> = {
  fortuna: 0,
  bassa: 0.4,
  media: 0.8,
  alta: 1.5,
};

export const DEFAULT_SETTINGS: Settings = { extraValue: 1, carBonus: 1, fairness: "media", sound: true };

export interface Stats {
  presences: number;
  /** Volte in cui ha pagato. */
  paidTimes: number;
  /** Caffè (ed extra) offerti agli altri, in caffè. */
  given: number;
  /** Caffè (ed extra) consumati, in caffè. */
  consumed: number;
  extras: number;
  drives: number;
  /** consumato − versato ± macchina. Positivo = deve offrire. Somma di tutti = 0. */
  balance: number;
}

const empty = (): Stats => ({ presences: 0, paidTimes: 0, given: 0, consumed: 0, extras: 0, drives: 0, balance: 0 });

/** Quanto consuma una persona in un pranzo. */
export function cost(id: string, extras: readonly string[], settings: Settings): number {
  return 1 + (extras.includes(id) ? settings.extraValue : 0);
}

/**
 * Correzione per la macchina: ogni autista guadagna `carBonus` caffè di credito,
 * pagati in parti uguali dai passeggeri. Se sono tutti autisti nessuno ci guadagna.
 */
export function carShares(present: readonly string[], drivers: readonly string[], settings: Settings): Record<string, number> {
  const out: Record<string, number> = {};
  const d = present.filter((id) => drivers.includes(id));
  const passengers = present.filter((id) => !drivers.includes(id));
  if (d.length === 0 || passengers.length === 0) return out;
  const each = (settings.carBonus * d.length) / passengers.length;
  for (const id of d) out[id] = -settings.carBonus;
  for (const id of passengers) out[id] = each;
  return out;
}

/** Libro mastro ricalcolato da zero sullo storico: l'ordine delle estrazioni non conta. */
export function ledger(sessions: readonly Session[], settings: Settings): Record<string, Stats> {
  const out: Record<string, Stats> = {};
  const get = (id: string) => (out[id] ??= empty());

  for (const s of sessions) {
    let total = 0;
    for (const id of s.present) {
      const c = cost(id, s.extras, settings);
      const st = get(id);
      st.presences += 1;
      st.consumed += c;
      if (s.extras.includes(id)) st.extras += 1;
      total += c;
    }
    for (const id of s.drivers) get(id).drives += 1;
    for (const [id, adj] of Object.entries(carShares(s.present, s.drivers, settings))) get(id).balance += adj;
    const payer = get(s.payerId);
    payer.paidTimes += 1;
    // Il proprio caffè non è "offerto": conta solo quanto ha pagato per gli altri
    payer.given += total - (s.present.includes(s.payerId) ? cost(s.payerId, s.extras, settings) : 0);
    payer.balance -= total;
  }

  for (const st of Object.values(out)) st.balance += st.consumed;
  return out;
}

export interface Odds {
  id: string;
  /** Saldo fino a ieri. */
  balance: number;
  /** Correzione per l'extra di oggi (≥ 0). */
  extra: number;
  /** Correzione per la macchina di oggi: negativa per chi guida, positiva per i passeggeri. */
  car: number;
  score: number;
  p: number;
}

/** Softmax numericamente stabile: somma 1, β = 0 → tutti uguali. */
export function softmax(scores: readonly number[], beta: number): number[] {
  if (scores.length === 0) return [];
  const max = Math.max(...scores.map((s) => beta * s));
  const w = scores.map((s) => Math.exp(beta * s - max));
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / sum);
}

/** Probabilità di pagare oggi per ognuno dei presenti. */
export function todayOdds(sessions: readonly Session[], today: Today, settings: Settings): Odds[] {
  const book = ledger(sessions, settings);
  const cars = carShares(today.present, today.drivers, settings);
  // Il punteggio è il saldo come sarà dopo oggi, escluso il pagamento (il caffè
  // di base è uguale per tutti e la softmax lo ignora)
  const rows = today.present.map((id) => {
    const balance = book[id]?.balance ?? 0;
    const extra = today.extras.includes(id) ? settings.extraValue : 0;
    const car = cars[id] ?? 0;
    return { id, balance, extra, car, score: balance + extra + car };
  });
  const ps = softmax(
    rows.map((r) => r.score),
    BETA[settings.fairness],
  );
  return rows.map((r, i) => ({ ...r, p: ps[i] }));
}
