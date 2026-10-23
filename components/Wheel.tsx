"use client";

import { useEffect, useRef, useState } from "react";
import { Coffee } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { layoutSlices, polar, slicePath, type Slice } from "@/lib/wheel";

const R = 100; // bordo
const RS = 88; // spicchi
const PEGS = 24;
const STEP = 360 / PEGS;
const norm = (a: number) => ((a % 360) + 360) % 360;
const sameIds = (a: readonly Slice[], b: readonly Slice[]) => a.length === b.length && a.every((s, i) => s.id === b[i].id);

/**
 * Ruota della fortuna. Spicchi grandi quanto la probabilità di ognuno, pioli
 * sul bordo che "ticchettano" contro la freccia. Si gira col pulsante o
 * trascinandola col dito in senso orario. La rotazione la tiene il genitore.
 */
export function Wheel({
  slices,
  rotation,
  spinning,
  interactive,
  winner,
  onSpinEnd,
  onDragEnd,
  onTick,
}: {
  slices: Slice[];
  rotation: number;
  spinning: boolean;
  interactive: boolean;
  winner?: { id: string; name: string; color: string } | null;
  onSpinEnd: () => void;
  /** Fine del trascinamento: nuova rotazione e se è stato un lancio. */
  onDragEnd: (rotation: number, fling: boolean) => void;
  onTick: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const wheel = useRef<SVGSVGElement>(null);
  const pointer = useRef<SVGSVGElement>(null);
  const lastTick = useRef(0);
  const lastPeg = useRef(-1);

  // ---------------------------------------------------------------- tick
  const hitPeg = (angle: number) => {
    const peg = Math.floor(norm(angle) / STEP);
    if (peg === lastPeg.current) return;
    lastPeg.current = peg;
    const now = performance.now();
    if (now - lastTick.current < 32) return;
    lastTick.current = now;
    onTick();
    pointer.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-24deg)" }, { transform: "rotate(0deg)" }], {
      duration: 150,
      easing: "cubic-bezier(0.3, 1.4, 0.5, 1)",
    });
  };

  // Durante il giro legge l'angolo reale dalla transizione CSS
  useEffect(() => {
    if (!spinning) return;
    let raf = 0;
    const loop = () => {
      const m = wheel.current && getComputedStyle(wheel.current).transform.match(/matrix\(([^)]+)\)/);
      if (m) {
        const [a, b] = m[1].split(",").map(Number);
        hitPeg((Math.atan2(b, a) * 180) / Math.PI);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // Se la scheda va in background il transitionend può non arrivare
    const fallback = setTimeout(onSpinEnd, 6000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fallback);
    };
    // hitPeg usa solo ref e onTick: basta ripartire a ogni giro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, rotation]);

  // ---------------------------------------------------------------- spicchi animati
  const [tween, setTween] = useState<{ key: Slice[]; ps: number[] } | null>(null);
  const shownPs = useRef<{ key: Slice[]; ps: number[] } | null>(null);
  useEffect(() => {
    const from = shownPs.current;
    const to = slices.map((s) => s.p);
    shownPs.current = { key: slices, ps: to };
    if (!from || !sameIds(from.key, slices) || spinning) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 360);
      const e = 1 - (1 - t) ** 3;
      const ps = to.map((p, i) => from.ps[i] + (p - from.ps[i]) * e);
      shownPs.current = { key: slices, ps };
      setTween(t < 1 ? { key: slices, ps } : null);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [slices, spinning]);
  const shown = tween && tween.key === slices ? layoutSlices(slices.map((s, i) => ({ ...s, p: tween.ps[i] }))) : slices;

  // ---------------------------------------------------------------- trascinamento
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ last: number; t: number; total: number; v: number } | null>(null);
  const angleAt = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const handlers = interactive
    ? {
        onPointerDown: (e: React.PointerEvent) => {
          drag.current = { last: angleAt(e), t: e.timeStamp, total: 0, v: 0 };
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: (e: React.PointerEvent) => {
          const d0 = drag.current;
          if (!d0) return;
          const a = angleAt(e);
          let d = a - d0.last;
          if (d > 180) d -= 360;
          if (d < -180) d += 360;
          const dt = Math.max(1, e.timeStamp - d0.t);
          d0.v = d0.v * 0.5 + (d / dt) * 0.5;
          d0.total += d;
          d0.last = a;
          d0.t = e.timeStamp;
          setOffset((o) => o + d);
          hitPeg(rotation + offset + d);
        },
        onPointerUp: () => {
          const d0 = drag.current;
          drag.current = null;
          setDragging(false);
          if (!d0) return;
          // Lancio deciso in senso orario: almeno 30° e 0,25°/ms
          const fling = d0.total > 30 && d0.v > 0.25;
          onDragEnd(rotation + offset, fling);
          setOffset(0);
        },
        onPointerCancel: () => {
          drag.current = null;
          setDragging(false);
          onDragEnd(rotation + offset, false);
          setOffset(0);
        },
      }
    : {};

  return (
    <div
      ref={box}
      className={`relative aspect-square w-full select-none ${interactive ? "cursor-grab touch-none active:cursor-grabbing" : ""}`}
      {...handlers}
    >
      {/* Freccia */}
      <svg
        ref={pointer}
        viewBox="-16 -4 32 40"
        className="absolute left-1/2 top-[-14px] z-20 w-[34px] -translate-x-1/2 drop-shadow-[0_4px_6px_rgb(0_0_0/0.3)]"
        style={{ transformOrigin: "50% 20%" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="ptr" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#e9e2da" />
          </linearGradient>
        </defs>
        <path d="M0 34 C-4 24 -13 14 -13 6 A13 13 0 0 1 13 6 C13 14 4 24 0 34 Z" fill="url(#ptr)" stroke="var(--rim)" strokeWidth="2" />
        <circle cx="0" cy="5" r="4.5" fill="var(--accent)" />
      </svg>

      <div className="size-full rounded-full drop-shadow-[0_18px_30px_rgb(40_20_5/0.28)]">
        {/* Ritaglio: ruotato, il quadrato dell'SVG sporgerebbe e farebbe scorrere la pagina di lato */}
        <div className="size-full overflow-hidden rounded-full">
        <svg
          ref={wheel}
          viewBox={`${-R - 1} ${-R - 1} ${2 * R + 2} ${2 * R + 2}`}
          className={`size-full ${dragging ? "" : "wheel-spin"}`}
          style={{ transform: `rotate(${rotation + offset}deg)`, transition: dragging ? "none" : undefined }}
          onTransitionEnd={(e) => e.propertyName === "transform" && spinning && onSpinEnd()}
          role="img"
          aria-label={`Ruota: ${slices.map((s) => `${s.label} ${Math.round(s.p * 100)}%`).join(", ")}`}
        >
          <defs>
            <radialGradient id="rim">
              <stop offset="0.86" stopColor="var(--rim-2)" />
              <stop offset="1" stopColor="var(--rim)" />
            </radialGradient>
          </defs>
          <circle r={R} fill="url(#rim)" />
          {shown.map((s) => (
            <path
              key={s.id}
              className="wheel-slice"
              d={slicePath(s.start, s.end, RS)}
              fill={s.color}
              stroke="var(--peg)"
              strokeOpacity={0.9}
              strokeWidth={1}
              strokeLinejoin="round"
              style={{ opacity: winner && winner.id !== s.id ? 0.25 : 1, filter: winner?.id === s.id ? "saturate(1.15)" : undefined }}
            />
          ))}
          {shown.map((s) => {
            const span = s.end - s.start;
            if (span < 14) return null;
            const mid = (s.start + s.end) / 2;
            const flip = mid > 180;
            const max = span > 60 ? 11 : span > 30 ? 8 : 5;
            const label = s.label.length > max ? `${s.label.slice(0, max - 1)}…` : s.label;
            return (
              <text
                key={s.id}
                className="wheel-slice"
                transform={`rotate(${mid - 90}) translate(${RS * 0.62} 0)${flip ? " rotate(180)" : ""}`}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={span > 40 ? 12.5 : span > 22 ? 10.5 : 8.5}
                fontWeight={700}
                letterSpacing="-0.01em"
                style={{ opacity: winner && winner.id !== s.id ? 0.35 : 1 }}
              >
                {label}
              </text>
            );
          })}
          {Array.from({ length: PEGS }, (_, i) => {
            const [x, y] = polar(i * STEP, (R + RS) / 2);
            return (
              <g key={i}>
                <circle cx={x + 0.4} cy={y + 0.6} r={2.4} fill="rgb(0 0 0 / 0.35)" />
                <circle cx={x} cy={y} r={2.3} fill="var(--peg)" />
              </g>
            );
          })}
        </svg>
        </div>
      </div>

      {/* Ombreggiatura e riflesso: fermi, come la luce della stanza */}
      <svg viewBox={`${-R - 1} ${-R - 1} ${2 * R + 2} ${2 * R + 2}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id="vignette">
            <stop offset="0.55" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.22" />
          </radialGradient>
          <linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle r={RS} fill="url(#vignette)" />
        <ellipse cx={0} cy={-RS * 0.42} rx={RS * 0.78} ry={RS * 0.5} fill="url(#gloss)" />
      </svg>

      {/* Mozzo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <div className="flex size-[25%] items-center justify-center rounded-full bg-surface shadow-[0_4px_14px_rgb(0_0_0/0.25),inset_0_1px_0_rgb(255_255_255/0.6)] ring-[3px] ring-[var(--rim)]">
          {winner ? (
            <span key={winner.id} className="animate-pop">
              <Avatar friend={winner} size={40} />
            </span>
          ) : (
            <Coffee className="size-[42%] text-accent" strokeWidth={2.2} />
          )}
        </div>
      </div>
    </div>
  );
}
