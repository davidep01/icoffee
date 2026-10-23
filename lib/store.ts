"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "./fairness";
import { uid } from "./random";
import type { Friend, Session, Settings, State } from "./types";

/**
 * I dati vivono solo in questo telefono (localStorage). Un backup JSON si
 * esporta e si reimporta dalle impostazioni.
 */
const KEY = "ipagato:v1";

/**
 * Colori degli spicchi: le varianti ad alto contrasto dei colori di sistema
 * Apple, leggibili con testo bianco in tema chiaro e scuro.
 */
export const COLORS = [
  "#C93400", "#0071A4", "#8944AB", "#D30F45", "#0040DD", "#248A3D",
  "#B25000", "#3634A3", "#0C817B", "#7F6545", "#AD3A90", "#536878",
];

const id = z.string().min(1);
export const stateSchema = z.object({
  version: z.literal(1),
  friends: z.array(
    z.object({ id, name: z.string().trim().min(1).max(40), color: z.string(), active: z.boolean() }),
  ),
  sessions: z.array(
    z.object({
      id,
      date: z.string(),
      present: z.array(id).min(1),
      drivers: z.array(id),
      extras: z.array(id),
      payerId: id,
      odds: z.record(z.string(), z.number()),
    }),
  ),
  settings: z.object({
    extraValue: z.number().min(0).max(10),
    carBonus: z.number().min(0).max(10),
    fairness: z.enum(["fortuna", "bassa", "media", "alta"]),
    sound: z.boolean().default(true),
  }),
});

const EMPTY: State = { version: 1, friends: [], sessions: [], settings: DEFAULT_SETTINGS };

let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? stateSchema.safeParse(JSON.parse(raw)) : null;
    cache = parsed?.success ? parsed.data : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Spazio pieno o navigazione privata: i dati restano almeno in memoria
  }
  listeners.forEach((l) => l());
}

function update(fn: (s: State) => State) {
  write(fn(read()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Un'altra scheda ha modificato i dati
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Stato corrente; `null` durante il prerender (sul server non c'è localStorage). */
export function useAppState(): State | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

export function nextColor(friends: readonly Friend[]): string {
  return COLORS[friends.length % COLORS.length];
}

export const actions = {
  setup(names: string[], settings: Settings) {
    const friends: Friend[] = [];
    for (const name of names) friends.push({ id: uid(), name, color: nextColor(friends), active: true });
    write({ ...EMPTY, friends, settings });
  },

  addFriend(name: string): string {
    const friendId = uid();
    update((s) => ({ ...s, friends: [...s.friends, { id: friendId, name, color: nextColor(s.friends), active: true }] }));
    return friendId;
  },

  updateFriend(friendId: string, patch: Partial<Pick<Friend, "name" | "active">>) {
    update((s) => ({ ...s, friends: s.friends.map((f) => (f.id === friendId ? { ...f, ...patch } : f)) }));
  },

  /** Si può eliminare solo chi non compare nello storico; gli altri si disattivano. */
  removeFriend(friendId: string) {
    update((s) =>
      s.sessions.some((x) => x.present.includes(friendId) || x.payerId === friendId)
        ? s
        : { ...s, friends: s.friends.filter((f) => f.id !== friendId) },
    );
  },

  updateSettings(patch: Partial<Settings>) {
    update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  },

  addSession(session: Omit<Session, "id">): string {
    const sessionId = uid();
    update((s) => ({ ...s, sessions: [...s.sessions, { ...session, id: sessionId }] }));
    return sessionId;
  },

  updateSession(sessionId: string, patch: Partial<Omit<Session, "id">>) {
    update((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === sessionId ? sanitize({ ...x, ...patch }) : x)) }));
  },

  deleteSession(sessionId: string) {
    update((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== sessionId) }));
  },

  /** Per l'"Annulla" dopo un'eliminazione. */
  restoreSession(session: Session) {
    update((s) => (s.sessions.some((x) => x.id === session.id) ? s : { ...s, sessions: [...s.sessions, session] }));
  },

  /** Lancia un errore se il file non è un backup valido. */
  importJson(text: string) {
    write(stateSchema.parse(JSON.parse(text)));
  },

  exportJson(): string {
    return JSON.stringify(read(), null, 2);
  },

  reset() {
    write(EMPTY);
  },
};

/** Macchina ed extra hanno senso solo per chi era presente. */
function sanitize(s: Session): Session {
  return {
    ...s,
    drivers: s.drivers.filter((x) => s.present.includes(x)),
    extras: s.extras.filter((x) => s.present.includes(x)),
  };
}
