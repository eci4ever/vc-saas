"use client";

import { useEffect, useState } from "react";

export type Status = {
  online: boolean;
  latencyMs: number;
};

type StatusResponse = {
  status: string;
  api: Status;
  db: Status;
};

const POLL_INTERVAL_MS = 30_000;

function StatusPill({ label, status }: { label: string; status: Status | null }) {
  const online = status?.online ?? false;
  const pending = status === null;
  const colorClasses = pending
    ? "border-zinc-300 text-zinc-500 dark:border-white/15 dark:text-zinc-400"
    : online
      ? "border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
      : "border-red-500/30 text-red-700 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${colorClasses}`}
    >
      <span className="relative flex size-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
            pending ? "bg-zinc-400" : online ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
        <span
          className={`relative inline-flex size-2 rounded-full ${
            pending ? "bg-zinc-400" : online ? "bg-emerald-500" : "bg-red-500"
          }`}
        />
      </span>
      {pending
        ? `${label} checking…`
        : online
          ? `${label} operational · ${status?.latencyMs}ms`
          : `${label} offline`}
    </span>
  );
}

export function StatusIndicators({ initialDb }: { initialDb: Status }) {
  const [api, setApi] = useState<Status | null>(null);
  const [db, setDb] = useState<Status>(initialDb);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const start = performance.now();
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        const data: StatusResponse = await res.json();
        if (cancelled) return;
        setApi({ online: true, latencyMs: Math.round(performance.now() - start) });
        setDb(data.db);
      } catch {
        if (cancelled) return;
        setApi({ online: false, latencyMs: Math.round(performance.now() - start) });
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <StatusPill label="API" status={api} />
      <StatusPill label="DB" status={db} />
    </div>
  );
}
