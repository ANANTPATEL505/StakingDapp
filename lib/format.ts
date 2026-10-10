import { formatUnits } from "ethers";

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** bigint token amount -> "1,234.56" */
export function fmt(value: bigint, decimals: number, maxFraction = 4): string {
  const s = formatUnits(value, decimals);
  const [int, frac = ""] = s.split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fracTrim = frac.slice(0, maxFraction).replace(/0+$/, "");
  return fracTrim ? `${intFmt}.${fracTrim}` : intFmt;
}

/** Turn wallet / RPC / ethers errors into something a human can read. */
export function parseError(e: unknown): string {
  const err = e as {
    code?: string | number;
    shortMessage?: string;
    reason?: string;
    message?: string;
    info?: { error?: { message?: string } };
  };
  if (err?.code === "ACTION_REJECTED" || err?.code === 4001) {
    return "You rejected the request in your wallet.";
  }
  if (err?.code === "INSUFFICIENT_FUNDS") {
    return "Not enough native token to pay for gas.";
  }
  const msg =
    err?.reason ||
    err?.info?.error?.message ||
    err?.shortMessage ||
    err?.message ||
    "Something went wrong.";
  return msg.length > 160 ? msg.slice(0, 157) + "…" : msg;
}
