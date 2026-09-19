"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export function UserRowActions({
  userId,
  role,
  banned,
}: {
  userId: string;
  role: string;
  banned: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<{ error: unknown }>) {
    setError(null);
    setPending(true);
    const { error } = await action();
    setPending(false);
    if (error) {
      setError(
        (error as { message?: string }).message ?? "Action failed."
      );
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <select
          value={role}
          disabled={pending}
            onChange={(e) =>
              run(() =>
                authClient.admin.setRole({
                  userId,
                  role: e.target.value as "user" | "admin",
                })
              )
            }
          className="h-9 rounded-lg border border-zinc-200 bg-transparent px-2 text-sm outline-none disabled:opacity-60 dark:border-white/15"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        {banned ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => authClient.admin.unbanUser({ userId }))}
            className="flex h-9 items-center rounded-lg border border-emerald-500/30 px-3 text-sm text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-60 dark:text-emerald-400"
          >
            Unban
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                authClient.admin.banUser({ userId, banReason: "Banned by admin" })
              )
            }
            className="flex h-9 items-center rounded-lg border border-red-500/30 px-3 text-sm text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400"
          >
            Ban
          </button>
        )}
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
