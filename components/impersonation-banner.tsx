"use client";

import { useRouter } from "next/navigation";

import { ScanFaceIcon } from "lucide-react";

import { authClient } from "@/lib/auth-client";

/** Amber bar shown while an admin is impersonating another user. */
export function ImpersonationBanner() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const impersonatedBy = (
    session?.session as { impersonatedBy?: string | null } | undefined
  )?.impersonatedBy;

  if (!impersonatedBy) return null;

  async function handleStop() {
    await authClient.admin.stopImpersonating();
    router.push("/app/admin/users");
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500/15 px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
      <ScanFaceIcon className="size-4" />
      <span>
        You are impersonating <strong>{session?.user.email}</strong>.
      </span>
      <button
        type="button"
        onClick={handleStop}
        className="rounded-full border border-amber-600/40 px-3 py-0.5 font-medium transition-colors hover:bg-amber-500/20"
      >
        Stop
      </button>
    </div>
  );
}
