"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Coffee } from "lucide-react";
import { LargeTitle } from "@/components/ui/LargeTitle";
import { TabBar } from "@/components/TabBar";
import { useAppState } from "@/lib/store";
import type { State } from "@/lib/types";

/** Struttura delle schermate principali; senza amici rimanda al wizard. */
export function AppShell({
  title,
  subtitle,
  trailing,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  children: (state: State) => React.ReactNode;
}) {
  const state = useAppState();
  const router = useRouter();
  const ready = state && state.friends.length > 0;

  useEffect(() => {
    if (state && state.friends.length === 0) router.replace("/setup");
  }, [state, router]);

  return (
    <>
      <main className="pt-safe mx-auto max-w-xl px-4 pb-36">
        <LargeTitle title={title} subtitle={subtitle} trailing={trailing} />
        {ready ? (
          children(state)
        ) : (
          <div className="flex h-[50dvh] items-center justify-center text-label-3">
            <Coffee className="size-10 animate-pulse" />
          </div>
        )}
      </main>
      {ready && <TabBar />}
    </>
  );
}
