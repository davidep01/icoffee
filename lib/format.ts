const num = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** +2,0 / −1,5 / 0,0 */
export function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return "0,0";
  return `${r > 0 ? "+" : "−"}${num.format(Math.abs(r))}`;
}

export function decimal(n: number): string {
  return Number.isInteger(n) ? String(n) : num.format(n);
}

export function percent(p: number): string {
  const v = p * 100;
  if (v > 0 && v < 1) return "<1%";
  if (v < 100 && v > 99) return ">99%";
  return `${Math.round(v)}%`;
}

const day = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" });
const time = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

/** "Ven 23 ott": solo la prima lettera maiuscola, come in italiano. */
export function shortDate(iso: string): string {
  const s = day.format(new Date(iso));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function clock(iso: string): string {
  return time.format(new Date(iso));
}

/** Valore per <input type="datetime-local">, nell'ora locale. */
export function toLocalInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
