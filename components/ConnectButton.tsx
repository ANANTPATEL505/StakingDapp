"use client";

import { useEffect, useRef, useState } from "react";
import { shortAddress } from "@/lib/format";

type Props = {
  account: string | null;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export default function ConnectButton({ account, connecting, onConnect, onDisconnect }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!account) {
    return (
      <button
        onClick={onConnect}
        disabled={connecting}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {connecting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400" />
        <span className="font-mono">{shortAddress(account)}</span>
        <span className="text-xs text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 animate-fade-up overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          <button onClick={copy} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/5">
            {copied ? "Copied ✓" : "Copy address"}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDisconnect();
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-white/5"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
