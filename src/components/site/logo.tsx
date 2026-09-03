"use client";

import { useRoute } from "@/lib/router";

export function Logo({ dark = false }: { dark?: boolean }) {
  const { navigate } = useRoute();
  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label="Madni Advertiser — go to home"
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary shadow-[0_0_18px_-4px] shadow-primary/70">
        {/* lightning bolt — LED energy */}
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary-foreground" fill="currentColor" aria-hidden="true">
          <path d="M13 2 4.5 13.5h5.2l-1.1 8.5L17.5 10.5h-5.2L13 2Z" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" aria-hidden="true" />
      </span>
      <span className="flex flex-col items-start leading-none">
        <span
          className={`font-display text-xl font-bold tracking-tight ${
            dark ? "text-white" : "text-zinc-900"
          }`}
        >
          MADNI
        </span>
        <span className="text-[10px] font-bold tracking-[0.32em] text-primary">ADVERTISER</span>
      </span>
    </button>
  );
}
