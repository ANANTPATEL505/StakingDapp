"use client";

import { BrowserProvider } from "ethers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CHAINS } from "@/lib/config";
import { parseError } from "@/lib/format";

const STORAGE_KEY = "staking-dapp:connected";

export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasWallet, setHasWallet] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recreated when account or chain changes so downstream hooks refetch.
  const provider = useMemo(() => {
    if (typeof window === "undefined" || !window.ethereum || !account) return null;
    return new BrowserProvider(window.ethereum, "any");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, chainId]);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) {
      setHasWallet(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const hex = (await eth.request({ method: "eth_chainId" })) as string;
        if (!cancelled) setChainId(parseInt(hex, 16));
        if (localStorage.getItem(STORAGE_KEY) === "1") {
          const accts = (await eth.request({ method: "eth_accounts" })) as string[];
          if (!cancelled && accts[0]) setAccount(accts[0]);
        }
      } catch {
        /* ignore – user can connect manually */
      }
    })();

    const onAccounts = (accts: string[]) => {
      if (accts.length === 0) {
        setAccount(null);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        setAccount(accts[0]);
      }
    };
    const onChain = (hex: string) => setChainId(parseInt(hex, 16));

    eth.on?.("accountsChanged", onAccounts);
    eth.on?.("chainChanged", onChain);
    return () => {
      cancelled = true;
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) {
      setHasWallet(false);
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const accts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      if (accts[0]) {
        setAccount(accts[0]);
        localStorage.setItem(STORAGE_KEY, "1");
      }
    } catch (e) {
      setError(parseError(e));
    } finally {
      setConnecting(false);
    }
  }, []);

  // Wallets can't be force-disconnected by a dapp; we just forget the session locally.
  const disconnect = useCallback(() => {
    setAccount(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const switchNetwork = useCallback(async (target: number) => {
    const eth = window.ethereum;
    if (!eth) return;
    const hex = "0x" + target.toString(16);
    setError(null);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (e) {
      const code = (e as { code?: number }).code;
      const info = CHAINS[target];
      if (code === 4902 && info) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: hex,
                chainName: info.name,
                nativeCurrency: info.currency,
                rpcUrls: info.rpcUrls,
                blockExplorerUrls: info.explorer ? [info.explorer] : undefined,
              },
            ],
          });
        } catch (e2) {
          setError(parseError(e2));
        }
      } else {
        setError(parseError(e));
      }
    }
  }, []);

  return {
    account,
    chainId,
    provider,
    hasWallet,
    connecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
}
