"use client";

import type { StakingData } from "@/hooks/useStaking";
import { fmt } from "@/lib/format";

type Props = {
  data: StakingData;
  busy: string | null;
  onClaim: () => Promise<boolean>;
};

export default function RewardsCard({ data, busy, onClaim }: Props) {
  const { earned, rewardDecimals: rd, rewardSymbol: rs, staked, totalStaked, rate, rewardPool } = data;

  const sharePct = totalStaked > 0n ? Number((staked * 10000n) / totalStaked) / 100 : 0;
  // Pool emits `rate` tokens per second split pro-rata (using the staking-token balance as total).
  const perSec = totalStaked > 0n ? (Number(rate) * Number(staked)) / Number(totalStaked) : 0;
  const underfunded = earned > 0n && rewardPool < earned;
  const working = busy !== null;

  return (
    <div className="space-y-5">
      <div
        className="animate-fade-up rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-transparent p-6 backdrop-blur"
        style={{ animationDelay: "180ms" }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-300/80">Claimable rewards</p>
        <p className="mt-3 flex items-baseline gap-2">
          <span className="text-5xl font-bold text-white">{fmt(earned, rd)}</span>
          <span className="text-lg font-semibold text-slate-400">{rs}</span>
        </p>
        <p className="mt-2 text-sm text-slate-400">
          {staked > 0n ? (
            <>
              Earning about <span className="font-mono text-slate-200">{perSec.toFixed(perSec < 1 ? 3 : 1)}</span>{" "}
              {rs} / second
            </>
          ) : (
            "Stake tokens to start earning."
          )}
        </p>

        {underfunded && (
          <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">
            The reward pool holds fewer {rs} than you've earned, so a claim may fail until the contract is topped up.
          </p>
        )}

        <button
          onClick={onClaim}
          disabled={earned === 0n || working}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-500/20 transition enabled:hover:bg-emerald-400 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
        >
          {busy === "Claim rewards" && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-950/30 border-t-emerald-950" />
          )}
          {busy === "Claim rewards" ? "Claiming…" : earned === 0n ? "Nothing to claim yet" : `Claim ${rs}`}
        </button>
      </div>

      <div
        className="animate-fade-up rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
        style={{ animationDelay: "240ms" }}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Your position</p>
        <dl className="mt-4 space-y-3 text-sm">
          <Row label={`Staked ${data.stakeSymbol}`} value={fmt(staked, data.stakeDecimals)} />
          <Row label="Pool share" value={`${sharePct.toFixed(2)}%`} />
          <Row label={`Wallet ${data.stakeSymbol}`} value={fmt(data.walletStake, data.stakeDecimals)} />
          <Row label={`Wallet ${rs}`} value={fmt(data.walletReward, rd)} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate-400">{label}</dt>
      <dd className="font-mono text-white">{value}</dd>
    </div>
  );
}
