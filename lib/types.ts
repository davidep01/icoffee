export type Fairness = "fortuna" | "bassa" | "media" | "alta";

export interface Friend {
  id: string;
  name: string;
  color: string;
  /** Chi non viene più resta nello storico ma non compare tra i presenti. */
  active: boolean;
}

/** Un'estrazione: chi c'era, chi ha guidato, chi ha preso un extra e chi ha pagato. */
export interface Session {
  id: string;
  /** ISO 8601 */
  date: string;
  present: string[];
  drivers: string[];
  extras: string[];
  payerId: string;
  /** Probabilità di ognuno al momento dell'estrazione (solo per lo storico). */
  odds: Record<string, number>;
}

export interface Settings {
  /** Quanti caffè vale un extra. */
  extraValue: number;
  /** Quanti caffè di credito guadagna chi porta la macchina. */
  carBonus: number;
  fairness: Fairness;
  /** Tick, campanella e vibrazione durante la ruota. */
  sound: boolean;
}

export interface State {
  version: 1;
  friends: Friend[];
  sessions: Session[];
  settings: Settings;
}

/** La situazione di oggi, prima di girare la ruota. */
export interface Today {
  present: string[];
  drivers: string[];
  extras: string[];
}
