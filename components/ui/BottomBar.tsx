"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const noop = () => () => {};

/**
 * Azione principale sempre a portata di pollice, sopra la tab bar.
 * Va nel body: un antenato animato (transform) farebbe da riferimento al
 * position: fixed e il pulsante finirebbe in fondo al contenuto.
 */
export function BottomBar({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) return null;
  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 z-30 px-4"
      style={{ bottom: "calc(max(env(safe-area-inset-bottom), 14px) + 78px)" }}
    >
      <div className="animate-toast pointer-events-auto mx-auto max-w-xl">{children}</div>
    </div>,
    document.body,
  );
}
