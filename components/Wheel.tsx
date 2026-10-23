"use client";

import { useEffect } from "react";
import { Coffee } from "lucide-react";
import { slicePath, type Slice } from "@/lib/wheel";

const R = 100;

/**
 * Ruota con spicchi grandi quanto la probabilità di ognuno. La rotazione la
 * decide il genitore; `onSpinEnd` arriva quando la ruota si ferma.
 */
export function Wheel({
  slices,
  rotation,
  spinning,
  onSpinEnd,
}: {
  slices: Slice[];
  rotation: number;
  spinning: boolean;
  onSpinEnd: () => void;
}) {
  // Se la scheda va in background il transitionend può non arrivare
  useEffect(() => {
    if (!spinning) return;
    const t = setTimeout(onSpinEnd, 5600);
    return () => clearTimeout(t);
  }, [spinning, rotation, onSpinEnd]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      <svg
        viewBox="-14 -2 28 22"
        className="absolute left-1/2 top-[-10px] z-10 w-9 -translate-x-1/2 drop-shadow-[0_3px_4px_rgb(0_0_0/0.25)]"
        aria-hidden
      >
        <path d="M -12 0 L 12 0 L 0 19 Z" fill="var(--label)" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      <div className="glass glass-strong size-full overflow-hidden rounded-full p-2.5">
        <svg
          viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`}
          className="wheel-spin pointer-events-none size-full"
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={(e) => e.propertyName === "transform" && spinning && onSpinEnd()}
          role="img"
          aria-label={slices.map((s) => `${s.label} ${Math.round(s.p * 100)}%`).join(", ")}
        >
          {slices.map((s) => (
            <path key={s.id} d={slicePath(s.start, s.end, R)} fill={s.color} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
          ))}
          {slices.map((s) => {
            const span = s.end - s.start;
            if (span < 13) return null;
            const mid = (s.start + s.end) / 2;
            const flip = mid > 180;
            const label = s.label.length > 10 ? `${s.label.slice(0, 9)}…` : s.label;
            return (
              <text
                key={s.id}
                transform={`rotate(${mid - 90}) translate(${R * 0.6} 0)${flip ? " rotate(180)" : ""}`}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={span < 28 ? 10 : 13}
                fontWeight={700}
                style={{ paintOrder: "stroke", stroke: "rgb(0 0 0 / 0.18)", strokeWidth: 2 }}
              >
                {label}
              </text>
            );
          })}
          <circle r={24} fill="white" />
        </svg>
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-accent" aria-hidden>
        <Coffee className="size-8" strokeWidth={2.2} />
      </div>
    </div>
  );
}
