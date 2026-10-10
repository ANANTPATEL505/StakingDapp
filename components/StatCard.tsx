import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  delay?: number;
};

export default function StatCard({ label, value, sub, delay = 0 }: Props) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-white">{value}</p>
      {sub && <p className="mt-1 truncate text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
