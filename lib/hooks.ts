"use client";

import { useEffect, useRef, useState } from "react";

const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** Valore che scorre verso `target` invece di saltare (numeri, percentuali). */
export function useTween(target: number, duration = 380): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  const current = useRef(target);

  useEffect(() => {
    from.current = current.current;
    if (from.current === target) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      current.current = from.current + (target - from.current) * easeOut(t);
      setShown(current.current);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return shown;
}
