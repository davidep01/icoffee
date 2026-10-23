"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Titolo grande HIG che, scorrendo, lascia il posto a una barra compatta in vetro.
 */
export function LargeTitle({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setCompact(!e.isIntersecting), { rootMargin: "-8px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div
        className={`fixed inset-x-0 top-0 z-30 transition-opacity duration-200 ${compact ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!compact}
      >
        <div className="glass pt-safe rounded-none border-x-0 border-t-0">
          <div className="mx-auto flex h-12 max-w-5xl items-center justify-center px-4">
            <span className="text-headline">{title}</span>
          </div>
        </div>
      </div>
      <header className="flex items-end justify-between gap-3 px-1 pb-2 pt-4">
        <div className="min-w-0">
          {subtitle && <div className="text-footnote font-semibold uppercase tracking-wide text-label-2">{subtitle}</div>}
          <h1 className="text-large-title truncate">{title}</h1>
        </div>
        {trailing && <div className="flex shrink-0 items-center gap-2 pb-1">{trailing}</div>}
      </header>
      <div ref={sentinel} aria-hidden />
    </>
  );
}
