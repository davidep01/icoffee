"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/** Notifica breve sopra la tab bar, con un'eventuale azione ("Annulla"). */
interface ToastData {
  id: number;
  message: string;
  action?: { label: string; onPress: () => void };
}

let current: ToastData | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, action?: ToastData["action"]) {
  current = { id: ++seq, message, action };
  emit();
}

function dismiss(id: number) {
  if (current?.id !== id) return;
  current = null;
  emit();
}

export function ToastHost() {
  const t = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );

  useEffect(() => {
    if (!t) return;
    const timer = setTimeout(() => dismiss(t.id), t.action ? 5000 : 2600);
    return () => clearTimeout(timer);
  }, [t]);

  if (!t) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-[75] flex justify-center px-4"
      style={{ bottom: "calc(max(env(safe-area-inset-bottom), 14px) + 82px)" }}
      role="status"
      aria-live="polite"
    >
      <div key={t.id} className="glass glass-strong animate-toast pointer-events-auto flex min-h-12 max-w-md items-center gap-3 rounded-full py-1.5 pl-5 pr-1.5">
        <span className="text-subhead font-semibold">{t.message}</span>
        {t.action ? (
          <button
            onClick={() => {
              t.action?.onPress();
              dismiss(t.id);
            }}
            className="glass-button h-9 rounded-full bg-accent-soft px-4 text-subhead font-semibold text-accent"
          >
            {t.action.label}
          </button>
        ) : (
          <span className="w-2" />
        )}
      </div>
    </div>,
    document.body,
  );
}
