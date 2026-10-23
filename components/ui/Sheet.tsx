"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const CloseContext = createContext<() => void>(() => {});

/** Chiude il foglio con l'animazione di uscita (da usare nei pulsanti al suo interno). */
export function useSheetClose() {
  return useContext(CloseContext);
}

/**
 * Bottom sheet su telefono, dialog centrato su schermi grandi.
 * Si chiude con Esc, tap sullo sfondo, ✕ o trascinandolo giù dalla maniglia.
 */
export function Sheet({
  onClose,
  title,
  children,
  footer,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Finita l'entrata si toglie l'animazione, altrimenti blocca il transform del trascinamento
  const [entered, setEntered] = useState(false);
  const start = useRef<{ y: number; t: number } | null>(null);

  const close = () => setLeaving(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setLeaving(true);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, []);

  const grab = {
    onPointerDown: (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      start.current = { y: e.clientY, t: e.timeStamp };
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dy = e.clientY - start.current.y;
      // Verso l'alto resiste, verso il basso segue il dito
      setDrag(dy > 0 ? dy : dy / 6);
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dy = e.clientY - start.current.y;
      const v = dy / Math.max(1, e.timeStamp - start.current.t);
      start.current = null;
      setDragging(false);
      if (dy > 120 || (dy > 30 && v > 0.6)) setLeaving(true);
      else setDrag(0);
    },
  };

  return createPortal(
    <CloseContext.Provider value={close}>
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div
        className={`absolute inset-0 bg-[var(--scrim)] ${leaving ? "animate-fade-out" : "animate-fade"}`}
        onClick={close}
        aria-hidden
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onAnimationEnd={(e) => {
          if (e.target !== panel.current) return;
          if (leaving) onClose();
          else setEntered(true);
        }}
        style={{ "--drag": `${drag}px`, transform: !leaving && drag ? `translateY(${drag}px)` : undefined, transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.3, 1.3, 0.5, 1)" } as CSSProperties}
        className={`glass glass-strong relative flex max-h-[92dvh] w-full flex-col rounded-t-[34px] outline-none md:max-w-lg md:rounded-[34px] ${leaving ? "animate-sheet-out" : entered ? "" : "animate-sheet"}`}
      >
        <div className="touch-none cursor-grab" {...grab}>
          <div className="mx-auto mt-2 h-[5px] w-9 rounded-full bg-fill-2 md:hidden" aria-hidden />
          <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-3 md:pt-5">
            <h2 className="text-title-3">{title}</h2>
            <button
              onClick={close}
              aria-label="Chiudi"
              className="glass-button flex size-[30px] items-center justify-center rounded-full bg-fill text-label-2"
            >
              <X className="size-4" strokeWidth={2.8} />
            </button>
          </header>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <footer className="pb-safe border-t border-separator px-5 pt-3">{footer}</footer>}
      </div>
    </div>
    </CloseContext.Provider>,
    document.body,
  );
}

/** Pulsante che esegue l'azione e poi chiude il foglio con l'animazione. */
export function SheetAction({ onPress, children }: { onPress: () => void; children: (press: () => void) => React.ReactNode }) {
  const close = useSheetClose();
  return (
    <>
      {children(() => {
        onPress();
        close();
      })}
    </>
  );
}
