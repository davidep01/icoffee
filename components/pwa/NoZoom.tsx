"use client";

import { useEffect } from "react";

/**
 * Disattiva il pinch-to-zoom (richiesto per l'uso a schermo intero sul tablet).
 * Safari su iOS ignora user-scalable=no: si bloccano i gesti di zoom e il pizzico a due dita.
 */
export function NoZoom() {
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    const pinch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("gesturestart", prevent);
    document.addEventListener("gesturechange", prevent);
    document.addEventListener("gestureend", prevent);
    document.addEventListener("touchmove", pinch, { passive: false });
    return () => {
      document.removeEventListener("gesturestart", prevent);
      document.removeEventListener("gesturechange", prevent);
      document.removeEventListener("gestureend", prevent);
      document.removeEventListener("touchmove", pinch);
    };
  }, []);
  return null;
}
