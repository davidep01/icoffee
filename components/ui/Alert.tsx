"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/**
 * Alert in stile iOS al posto di window.confirm (che in una PWA mostra
 * "localhost dice…"). `confirmAlert` restituisce una promise.
 */
interface AlertRequest {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  resolve: (ok: boolean) => void;
}

let current: AlertRequest | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function confirmAlert(opts: Omit<AlertRequest, "resolve">): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...opts, resolve };
    emit();
  });
}

function close(ok: boolean) {
  current?.resolve(ok);
  current = null;
  emit();
}

export function AlertHost() {
  const req = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );

  useEffect(() => {
    if (!req) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [req]);

  if (!req) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-8">
      <div className="animate-fade absolute inset-0 bg-[var(--scrim)]" onClick={() => close(false)} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        className="glass glass-strong animate-alert relative w-full max-w-[300px] rounded-[30px] p-5 text-center"
      >
        <h2 id="alert-title" className="text-headline">
          {req.title}
        </h2>
        {req.message && <p className="mt-1 text-footnote text-label-2">{req.message}</p>}
        <div className="mt-5 flex gap-2">
          <button autoFocus onClick={() => close(false)} className="glass-button h-11 flex-1 rounded-full bg-fill text-headline font-semibold">
            {req.cancelLabel ?? "Annulla"}
          </button>
          <button
            onClick={() => close(true)}
            className={`glass-button h-11 flex-1 rounded-full text-headline font-semibold ${req.destructive ? "bg-red text-white" : "bg-accent text-on-accent"}`}
          >
            {req.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
