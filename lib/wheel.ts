/** Geometria della ruota: 0° è in alto (dove sta la freccia), si gira in senso orario. */

export interface Slice {
  id: string;
  label: string;
  color: string;
  p: number;
  start: number;
  end: number;
}

export function layoutSlices(items: readonly { id: string; label: string; color: string; p: number }[]): Slice[] {
  let at = 0;
  return items.map((it) => {
    const start = at;
    at += it.p * 360;
    return { ...it, start, end: at };
  });
}

/**
 * Rotazione finale (in gradi, sempre in avanti di almeno `turns` giri) perché la
 * freccia si fermi in un punto casuale dello spicchio vincente, lontano dai bordi.
 */
export function targetRotation(slice: Slice, current: number, rand: () => number, turns = 6): number {
  const angle = slice.start + (slice.end - slice.start) * (0.15 + 0.7 * rand());
  const delta = (((-angle - current) % 360) + 360) % 360;
  return current + turns * 360 + delta;
}

/** Angolo della ruota che si trova sotto la freccia per una certa rotazione. */
export function angleUnderPointer(rotation: number): number {
  return (((-rotation) % 360) + 360) % 360;
}

/** Coordinate (x, y) di un angolo della ruota a distanza r dal centro. */
export function polar(angle: number, r: number): [number, number] {
  const rad = ((angle - 90) * Math.PI) / 180;
  return [r * Math.cos(rad), r * Math.sin(rad)];
}

/** Path SVG di uno spicchio centrato in (0,0). */
export function slicePath(start: number, end: number, r: number): string {
  if (end - start >= 359.999) return `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r} Z`;
  const [x0, y0] = polar(start, r);
  const [x1, y1] = polar(end, r);
  const large = end - start > 180 ? 1 : 0;
  return `M 0 0 L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`;
}
