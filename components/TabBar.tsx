"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, History, Scale, Settings } from "lucide-react";

const TABS = [
  { href: "/", label: "Oggi", icon: Coffee },
  { href: "/storico", label: "Storico", icon: History },
  { href: "/saldi", label: "Saldi", icon: Scale },
  { href: "/impostazioni", label: "Regole", icon: Settings },
];

/** Tab bar flottante a capsula (Liquid Glass), come in imangiato. */
export function TabBar() {
  const pathname = usePathname().replace(/\/$/, "") || "/";

  return (
    <nav
      aria-label="Sezioni"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 14px)" }}
    >
      <div className="glass glass-strong pointer-events-auto flex gap-1 rounded-full p-1.5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`glass-button flex h-[54px] min-w-[68px] flex-col items-center justify-center gap-0.5 rounded-full px-3 transition-colors sm:min-w-[84px] ${
                active ? "bg-accent-soft text-accent" : "text-label-2 hover:text-label"
              }`}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} aria-hidden />
              <span className="text-[11px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
