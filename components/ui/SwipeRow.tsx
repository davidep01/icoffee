"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const ACTION = 84;

/**
 * Riga con "scorri per eliminare": scorrendo a sinistra compare il pulsante
 * rosso, scorrendo fino in fondo si elimina subito.
 */
export function SwipeRow({ children, onDelete, label = "Elimina" }: { children: React.ReactNode; onDelete: () => void; label?: string }) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const g = useRef<{ x: number; y: number; base: number; dir?: "h" | "v"; moved: boolean } | null>(null);

  const width = () => row.current?.offsetWidth ?? 360;

  return (
    <div className="relative overflow-hidden">
      {x < 0 && (
        <button
          onClick={onDelete}
          className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-0.5 bg-red text-caption font-semibold text-white"
          style={{ width: -x }}
          aria-label={label}
        >
          <Trash2 className="size-5" strokeWidth={2.2} aria-hidden />
          {-x > 60 && label}
        </button>
      )}
      <div
        ref={row}
        className="relative touch-pan-y"
        style={{ transform: `translateX(${x}px)`, transition: dragging ? "none" : "transform 0.35s cubic-bezier(0.3, 1.2, 0.5, 1)" }}
        onPointerDown={(e) => {
          g.current = { x: e.clientX, y: e.clientY, base: x, moved: false };
        }}
        onPointerMove={(e) => {
          const s = g.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (!s.dir) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
              s.dir = "h";
              setDragging(true);
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            } else if (Math.abs(dy) > 8) s.dir = "v";
          }
          if (s.dir === "h") {
            s.moved = true;
            setX(Math.min(0, Math.max(-width(), s.base + dx)));
          }
        }}
        onPointerUp={() => {
          const s = g.current;
          setDragging(false);
          if (s?.dir === "h") {
            if (x < -width() * 0.6) {
              setX(-width());
              setTimeout(onDelete, 180);
            } else setX(x < -ACTION / 2 ? -ACTION : 0);
          }
        }}
        onPointerCancel={() => {
          setDragging(false);
          g.current = null;
          setX((v) => (v < -ACTION / 2 ? -ACTION : 0));
        }}
        onClickCapture={(e) => {
          // Un tap su una riga aperta la richiude invece di aprirla
          if (g.current?.moved || x !== 0) {
            e.stopPropagation();
            e.preventDefault();
            if (!g.current?.moved) setX(0);
          }
          g.current = null;
        }}
      >
        {children}
      </div>
    </div>
  );
}
