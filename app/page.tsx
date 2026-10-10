"use client";

import { isAddress } from "ethers";
import type { ReactNode } from "react";
import ConnectButton from "@/components/ConnectButton";
import RewardsCard from "@/components/RewardsCard";
import StakePanel from "@/components/StakePanel";
import StatCard from "@/components/StatCard";
import { useStaking } from "@/hooks/useStaking";
import { useWallet } from "@/hooks/useWallet";
import { STAKING_ADDRESS, TARGET_CHAIN_ID, chainName } from "@/lib/config";
import { fmt } from "@/lib/format";

export default function Home() {
  const wallet = useWallet();
  const { account, chainId, provider } = wallet;

  const configured = isAddress(STAKING_ADDRESS);
  const onRightChain = chainId === TARGET_CHAIN_ID;
  const ready = configured && !!account && onRightChain;

  const staking = useStaking(provider, account, chainId, ready);
  const { data } = staking;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-6 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
            S
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight text-white">Stake &amp; Earn</h1>
            <p className="text-xs text-slate-400">
              {data ? `Stake ${data.stakeSymbol}, earn ${data.rewardSymbol}` : "Stake tokens, earn rewards"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {account && chainId !== null && (
            <span
              className={`hidden rounded-full border px-3 py-1 text-xs font-medium sm:inline ${
                onRightChain
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : "border-amber-400/20 bg-amber-400/10 text-amber-200"
              }`}
            >
              {chainName(chainId)}
            </span>
          )}
          <ConnectButton
            account={account}
            connecting={wallet.connecting}
            onConnect={wallet.connect}
            onDisconnect={wallet.disconnect}
          />
        </div>
      </header>

      <main className="mt-10">
        {!configured ? (
          <Notice
            tone="warn"
            title="Contract address not set"
            body={
              <>
                Copy <code className="rounded bg-black/40 px-1.5 py-0.5">.env.example</code> to{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5">.env.local</code>, set{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5">NEXT_PUBLIC_STAKING_ADDRESS</code> to your
                deployed Staking contract, then restart the dev server.
              </>
            }
          />
        ) : !wallet.hasWallet ? (
          <Notice
            title="No browser wallet detected"
            body="Install MetaMask (or another EIP-1193 wallet) and refresh this page."
            action={
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Get MetaMask ↗
              </a>
            }
          />
        ) : !account ? (
          <Hero onConnect={wallet.connect} connecting={wallet.connecting} error={wallet.error} />
        ) : !onRightChain ? (
          <Notice
            tone="warn"
            title="Wrong network"
            body={`Your wallet is on ${chainName(chainId)}. Switch to ${chainName(TARGET_CHAIN_ID)} to continue.`}
            action={
              <button
                onClick={() => wallet.switchNetwork(TARGET_CHAIN_ID)}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
              >
                Switch to {chainName(TARGET_CHAIN_ID)}
              </button>
            }
            error={wallet.error}
          />
        ) : staking.loadError && !data ? (
          <Notice tone="warn" title="Can't load contract" body={staking.loadError} />
        ) : !data ? (
          <Skeleton />
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Total staked"
                value={fmt(data.totalStaked, data.stakeDecimals)}
                sub={data.stakeSymbol}
                delay={0}
              />
              <StatCard
                label="Reward pool"
                value={fmt(data.rewardPool, data.rewardDecimals)}
                sub={`${data.rewardSymbol} available`}
                delay={50}
              />
              <StatCard
                label="Emission"
                value={`${data.rate.toString()} / s`}
                sub={`${data.rewardSymbol}, shared by stakers`}
                delay={100}
              />
              <StatCard
                label="Your stake"
                value={fmt(data.staked, data.stakeDecimals)}
                sub={data.stakeSymbol}
                delay={150}
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <StakePanel
                  data={data}
                  busy={staking.busy}
                  onApprove={staking.approve}
                  onStake={staking.stake}
                  onWithdraw={staking.withdraw}
                />
              </div>
              <div className="lg:col-span-2">
                <RewardsCard data={data} busy={staking.busy} onClaim={staking.claim} />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function Hero({
  onConnect,
  connecting,
  error,
}: {
  onConnect: () => void;
  connecting: boolean;
  error: string | null;
}) {
  return (
    <div className="animate-fade-up mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur">
      <h2 className="text-3xl font-bold text-white">Put your tokens to work</h2>
      <p className="mt-3 text-slate-400">
        Connect your wallet to stake, track your rewards in real time and claim whenever you like.
      </p>
      <button
        onClick={onConnect}
        disabled={connecting}
        className="mt-8 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3.5 font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        {connecting ? "Check your wallet…" : "Connect wallet"}
      </button>
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
    </div>
  );
}

function Notice({
  title,
  body,
  action,
  error,
  tone = "info",
}: {
  title: string;
  body: ReactNode;
  action?: ReactNode;
  error?: string | null;
  tone?: "info" | "warn";
}) {
  return (
    <div
      className={`animate-fade-up mx-auto max-w-xl rounded-3xl border p-8 text-center backdrop-blur ${
        tone === "warn" ? "border-amber-400/20 bg-amber-400/[0.06]" : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.05]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.05] lg:col-span-3" />
        <div className="h-96 animate-pulse rounded-3xl bg-white/[0.05] lg:col-span-2" />
      </div>
    </div>
  );
}
