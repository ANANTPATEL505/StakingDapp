"use client";

import { formatUnits, parseUnits } from "ethers";
import { useMemo, useState } from "react";
import type { StakingData } from "@/hooks/useStaking";
import { fmt } from "@/lib/format";

type Props = {
  data: StakingData;
  busy: string | null;
  onApprove: (amount: bigint) => Promise<boolean>;
  onStake: (amount: bigint) => Promise<boolean>;
  onWithdraw: (amount: bigint) => Promise<boolean>;
};

type Tab = "stake" | "withdraw";

export default function StakePanel({ data, busy, onApprove, onStake, onWithdraw }: Props) {
  const [tab, setTab] = useState<Tab>("stake");
  const [input, setInput] = useState("");

  const { stakeDecimals: dec, stakeSymbol: sym } = data;
  const available = tab === "stake" ? data.walletStake : data.staked;

  const parsed = useMemo(() => {
    if (!input || input === ".") return { value: null as bigint | null, error: null as string | null };
    try {
      const v = parseUnits(input, dec);
      if (v <= 0n) return { value: null, error: "Enter an amount greater than 0." };
      if (v > available)
        return {
          value: null,
          error: tab === "stake" ? "Amount exceeds your wallet balance." : "Amount exceeds your staked balance.",
        };
      return { value: v, error: null };
    } catch {
      return { value: null, error: dec === 0 ? "Whole numbers only." : `Max ${dec} decimal places.` };
    }
  }, [input, dec, available, tab]);

  const needsApproval = tab === "stake" && parsed.value !== null && data.allowance < parsed.value;
  const working = busy !== null;

  const onChange = (raw: string) => {
    const re = dec === 0 ? /^\d*$/ : /^\d*\.?\d*$/;
    if (re.test(raw)) setInput(raw);
  };

  const setPct = (pct: bigint) => {
    const v = (available * pct) / 100n;
    setInput(v === 0n ? "" : formatUnits(v, dec));
  };

  const submit = async () => {
    if (parsed.value === null) return;
    let ok: boolean;
    if (tab === "stake") ok = needsApproval ? await onApprove(parsed.value) : await onStake(parsed.value);
    else ok = await onWithdraw(parsed.value);
    // After a successful stake/withdraw clear the field; after approve keep it so the user can stake next.
    if (ok && !(tab === "stake" && needsApproval)) setInput("");
  };

  const buttonLabel = () => {
    if (busy) return `${busy}…`;
    if (parsed.value === null) return input ? "Fix amount" : "Enter an amount";
    if (tab === "withdraw") return `Withdraw ${sym}`;
    return needsApproval ? `Approve ${sym}` : `Stake ${sym}`;
  };

  return (
    <div className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur" style={{ animationDelay: "120ms" }}>
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/30 p-1">
        {(["stake", "withdraw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setInput("");
            }}
            className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
              tab === t ? "bg-white/10 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Amount input */}
      <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4 focus-within:border-indigo-400/50">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Amount</span>
          <span>
            {tab === "stake" ? "Wallet" : "Staked"}:{" "}
            <span className="font-mono text-slate-300">{fmt(available, dec)}</span> {sym}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <input
            inputMode={dec === 0 ? "numeric" : "decimal"}
            placeholder="0"
            value={input}
            onChange={(e) => onChange(e.target.value)}
            disabled={working}
            className="min-w-0 flex-1 bg-transparent text-3xl font-semibold text-white outline-none placeholder:text-slate-600"
          />
          <span className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white">{sym}</span>
        </div>
        <div className="mt-3 flex gap-2">
          {[25n, 50n, 75n, 100n].map((p) => (
            <button
              key={p.toString()}
              onClick={() => setPct(p)}
              disabled={working || available === 0n}
              className="flex-1 rounded-lg border border-white/10 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              {p === 100n ? "Max" : `${p}%`}
            </button>
          ))}
        </div>
      </div>

      {parsed.error && <p className="mt-3 text-sm text-rose-300">{parsed.error}</p>}

      {/* Two-step hint */}
      {tab === "stake" && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
          <Step n={1} active={needsApproval} done={parsed.value !== null && !needsApproval} label="Approve" />
          <span className="h-px flex-1 bg-white/10" />
          <Step n={2} active={parsed.value !== null && !needsApproval} done={false} label="Stake" />
        </div>
      )}

      <button
        onClick={submit}
        disabled={parsed.value === null || working}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:shadow-none disabled:text-slate-400"
      >
        {working && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
        {buttonLabel()}
      </button>

      {tab === "stake" && (
        <p className="mt-3 text-center text-xs text-slate-500">
          Approval is for the exact amount you enter, nothing more.
        </p>
      )}
    </div>
  );
}

function Step({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
          done
            ? "bg-emerald-400/20 text-emerald-300"
            : active
            ? "bg-indigo-500 text-white"
            : "bg-white/10 text-slate-400"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className={active ? "text-slate-200" : ""}>{label}</span>
    </span>
  );
}
