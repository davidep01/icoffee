"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Bottom sheet su telefono, dialog centrato su schermi grandi.
 * Si chiude con Esc, tap sullo sfondo o il bottone ✕.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="animate-fade absolute inset-0 bg-black/15 backdrop-blur-[3px]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="glass glass-strong animate-sheet relative flex max-h-[92dvh] w-full flex-col rounded-t-[32px] outline-none md:max-w-xl md:rounded-[32px]"
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-fill-2 md:hidden" aria-hidden />
        <header className="flex items-center justify-between gap-4 px-5 pb-2 pt-3 md:pt-5">
          <h2 className="text-title-3">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="glass-button flex size-8 items-center justify-center rounded-full bg-fill text-label-2"
          >
            <X className="size-4" strokeWidth={2.6} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
        {footer && <footer className="pb-safe border-t border-separator px-5 pt-3">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
