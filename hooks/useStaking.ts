"use client";

import { BrowserProvider, Contract, type ContractTransactionResponse, type Signer } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toasts";
import { ERC20_ABI, STAKING_ABI } from "@/lib/abi";
import { CHAINS, STAKING_ADDRESS } from "@/lib/config";
import { parseError } from "@/lib/format";

export type StakingData = {
  stakeSymbol: string;
  rewardSymbol: string;
  stakeDecimals: number;
  rewardDecimals: number;
  walletStake: bigint;
  walletReward: bigint;
  staked: bigint;
  earned: bigint;
  allowance: bigint;
  /** Approximation: staking-token balance held by the Staking contract (totalstakedtoken is private). */
  totalStaked: bigint;
  /** Reward-token balance held by the Staking contract. */
  rewardPool: bigint;
  rate: bigint;
};

const POLL_MS = 5000;

export function useStaking(
  provider: BrowserProvider | null,
  account: string | null,
  chainId: number | null,
  enabled: boolean
) {
  const toast = useToast();
  const [data, setData] = useState<StakingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const tokenAddrs = useRef<{ stake: string; reward: string } | null>(null);

  useEffect(() => {
    tokenAddrs.current = null;
    setData(null);
  }, [provider]);

  const refresh = useCallback(async () => {
    if (!provider || !account || !enabled) return;
    try {
      const staking = new Contract(STAKING_ADDRESS, STAKING_ABI, provider);
      if (!tokenAddrs.current) {
        const [stake, reward] = await Promise.all([staking.s_stakingtoken(), staking.s_rewardtoken()]);
        tokenAddrs.current = { stake, reward };
      }
      const stakeTok = new Contract(tokenAddrs.current.stake, ERC20_ABI, provider);
      const rewardTok = new Contract(tokenAddrs.current.reward, ERC20_ABI, provider);

      const [
        stakeSymbol,
        rewardSymbol,
        stakeDecimals,
        rewardDecimals,
        walletStake,
        walletReward,
        staked,
        earned,
        allowance,
        totalStaked,
        rewardPool,
        rate,
      ] = await Promise.all([
        stakeTok.symbol(),
        rewardTok.symbol(),
        stakeTok.decimals(),
        rewardTok.decimals(),
        stakeTok.balanceOf(account),
        rewardTok.balanceOf(account),
        staking.stakebalance(account),
        staking.earned(account),
        stakeTok.allowance(account, STAKING_ADDRESS),
        stakeTok.balanceOf(STAKING_ADDRESS),
        rewardTok.balanceOf(STAKING_ADDRESS),
        staking.rewardrate(),
      ]);

      setData({
        stakeSymbol,
        rewardSymbol,
        stakeDecimals: Number(stakeDecimals),
        rewardDecimals: Number(rewardDecimals),
        walletStake,
        walletReward,
        staked,
        earned,
        allowance,
        totalStaked,
        rewardPool,
        rate,
      });
      setLoadError(null);
    } catch {
      setLoadError(
        "Couldn't read the staking contract. Check NEXT_PUBLIC_STAKING_ADDRESS and that your wallet is on the right network."
      );
    }
  }, [provider, account, enabled]);

  // Initial load + polling
  useEffect(() => {
    if (!provider || !account || !enabled) return;
    let alive = true;
    setLoading(true);
    refresh().finally(() => alive && setLoading(false));
    const id = setInterval(refresh, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [provider, account, enabled, refresh]);

  const send = useCallback(
    async (
      label: string,
      build: (signer: Signer) => Promise<ContractTransactionResponse>
    ): Promise<boolean> => {
      if (!provider) return false;
      setBusy(label);
      const id = toast.push({ kind: "pending", title: label, message: "Confirm in your wallet…" });
      try {
        const signer = await provider.getSigner();
        const tx = await build(signer);
        const href = chainId && CHAINS[chainId]?.explorer ? `${CHAINS[chainId].explorer}/tx/${tx.hash}` : undefined;
        toast.update(id, { message: "Waiting for confirmation…", href });
        await tx.wait();
        toast.update(id, { kind: "success", title: `${label} confirmed`, message: undefined, href });
        await refresh();
        return true;
      } catch (e) {
        toast.update(id, { kind: "error", title: `${label} failed`, message: parseError(e) });
        return false;
      } finally {
        setBusy(null);
      }
    },
    [provider, chainId, toast, refresh]
  );

  const approve = useCallback(
    (amount: bigint) =>
      send("Approve", (signer) => {
        if (!tokenAddrs.current) throw new Error("Contract not loaded yet.");
        return new Contract(tokenAddrs.current.stake, ERC20_ABI, signer).approve(STAKING_ADDRESS, amount);
      }),
    [send]
  );

  const stake = useCallback(
    (amount: bigint) =>
      send("Stake", (signer) => new Contract(STAKING_ADDRESS, STAKING_ABI, signer).stake(amount)),
    [send]
  );

  const withdraw = useCallback(
    (amount: bigint) =>
      send("Withdraw", (signer) => new Contract(STAKING_ADDRESS, STAKING_ABI, signer).Withdraw(amount)),
    [send]
  );

  const claim = useCallback(
    () => send("Claim rewards", (signer) => new Contract(STAKING_ADDRESS, STAKING_ABI, signer).GetReward()),
    [send]
  );

  return { data, loading, loadError, busy, refresh, approve, stake, withdraw, claim };
}
