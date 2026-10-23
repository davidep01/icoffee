import type { CSSProperties, ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

/** Sezione di una lista raggruppata, come nell'app Impostazioni. */
export function ListSection({
  header,
  footer,
  children,
  className = "",
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`mt-7 first:mt-1 ${className}`}>
      {header && <h2 className="px-4 pb-2 text-footnote font-semibold uppercase tracking-[0.04em] text-label-2">{header}</h2>}
      <div className="glass overflow-hidden rounded-[22px]">
        <ul>{children}</ul>
      </div>
      {footer && <div className="px-4 pt-2 text-footnote text-label-2">{footer}</div>}
    </section>
  );
}

/** Icona in un riquadro colorato, come le voci delle Impostazioni. */
export function IconTile({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] text-white" style={{ background: color }} aria-hidden>
      <Icon className="size-[18px]" strokeWidth={2.2} />
    </span>
  );
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onClick,
  chevron,
  tone = "default",
  inset,
  children,
  label,
}: {
  leading?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  tone?: "default" | "accent" | "destructive";
  /** Rientro del separatore: di default allineato al testo. */
  inset?: number;
  children?: ReactNode;
  label?: string;
}) {
  const style = { "--inset": `${inset ?? (leading ? 58 : 16)}px` } as CSSProperties;
  const titleClass = tone === "destructive" ? "text-red" : tone === "accent" ? "text-accent" : "text-label";
  const body = (
    <>
      <div className="flex min-h-[52px] items-center gap-3 px-4 py-2">
        {leading}
        <div className="min-w-0 flex-1">
          {title && <div className={`truncate text-body ${titleClass}`}>{title}</div>}
          {subtitle && <div className="truncate text-footnote text-label-2">{subtitle}</div>}
        </div>
        {trailing}
        {chevron && <ChevronRight className="-mr-1 size-5 shrink-0 text-label-3" strokeWidth={2.4} aria-hidden />}
      </div>
      {children}
    </>
  );
  return (
    <li className="list-row" style={style}>
      {onClick ? (
        <button type="button" onClick={onClick} aria-label={label} className="list-press block w-full text-left">
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}
