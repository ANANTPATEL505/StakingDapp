export const STAKING_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_ADDRESS ?? "").trim();
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 11155111);

export type ChainInfo = {
  name: string;
  currency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  explorer?: string;
};

export const CHAINS: Record<number, ChainInfo> = {
  11155111: {
    name: "Sepolia",
    currency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://rpc.sepolia.org"],
    explorer: "https://sepolia.etherscan.io",
  },
  
};

export const chainName = (id: number | null) =>
  id == null ? "Unknown" : CHAINS[id]?.name ?? `Chain ${id}`;
