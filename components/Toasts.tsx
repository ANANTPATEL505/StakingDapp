"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "pending" | "success" | "error";

export type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  href?: string;
};

type ToastApi = {
  push: (t: Omit<Toast, "id">) => number;
  update: (id: number, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
};

const Ctx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, kind: ToastKind) => {
      clearTimeout(timers.current[id]);
      if (kind === "pending") return;
      timers.current[id] = setTimeout(() => dismiss(id), kind === "error" ? 9000 : 6000);
    },
    [dismiss]
  );

  const push = useCallback<ToastApi["push"]>(
    (t) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { ...t, id }]);
      schedule(id, t.kind);
      return id;
    },
    [schedule]
  );

  const update = useCallback<ToastApi["update"]>(
    (id, patch) => {
      setToasts((list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x)));
      if (patch.kind) schedule(id, patch.kind);
    },
    [schedule]
  );

  const api = useMemo(() => ({ push, update, dismiss }), [push, update, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-3 p-4 sm:items-end sm:p-6">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

const styles: Record<ToastKind, { ring: string; icon: ReactNode }> = {
  pending: {
    ring: "border-indigo-400/30",
    icon: (
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-300" />
    ),
  },
  success: {
    ring: "border-emerald-400/30",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-xs text-emerald-300">
        ✓
      </span>
    ),
  },
  error: {
    ring: "border-rose-400/30",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-400/20 text-xs text-rose-300">
        !
      </span>
    ),
  },
};

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const s = styles[toast.kind];
  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-2xl border ${s.ring} bg-slate-900/95 p-4 shadow-2xl shadow-black/40 backdrop-blur`}
    >
      <div className="mt-0.5">{s.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{toast.title}</p>
        {toast.message && <p className="mt-0.5 break-words text-xs text-slate-400">{toast.message}</p>}
        {toast.href && (
          <a
            href={toast.href}
            target="_blank"
            rel="noreferrer"
            className="mt-1.5 inline-block text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            View on explorer ↗
          </a>
        )}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss"
        className="text-slate-500 transition hover:text-slate-300"
      >
        ✕
      </button>
    </div>
  );
}
