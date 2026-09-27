"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

async function postAction(
  path: "/rename" | "/delete",
  body: Record<string, string>
): Promise<string | null> {
  const res = await fetch(`/api/admin/organizations${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.ok) return null;
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? "Action failed.";
  } catch {
    return "Action failed.";
  }
}

export function OrgRowActions({
  organizationId,
  orgName,
}: {
  organizationId: string;
  orgName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState(orgName);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleRenameConfirm() {
    if (!name.trim()) return;
    setError(null);
    setPending(true);
    const message = await postAction("/rename", {
      organizationId,
      name: name.trim(),
    });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setRenameOpen(false);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    setError(null);
    setPending(true);
    const message = await postAction("/delete", { organizationId });
    setPending(false);
    if (message) {
      setError(message);
      return;
    }
    setDeleteOpen(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setRenameOpen(true)}
          className="flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/10"
        >
          Rename
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                disabled={pending}
                title="More actions"
                className="flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-100 disabled:opacity-60 dark:border-white/15 dark:text-zinc-400 dark:hover:bg-white/10"
              />
            }
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem onClick={() => setRenameOpen(true)} disabled={pending}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
              className="text-red-600 dark:text-red-400"
            >
              Delete organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename organization</AlertDialogTitle>
            <AlertDialogDescription>
              The slug stays the same, so existing links keep working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-transparent px-3 text-sm font-normal outline-none focus:border-zinc-950 dark:border-white/15 dark:focus:border-white"
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending || !name.trim()}
              onClick={(e) => {
                e.preventDefault();
                handleRenameConfirm();
              }}
            >
              {pending ? "Saving…" : "Save"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{orgName}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Every member, team, and invitation in this organization will be
              removed. This action is recorded in the admin audit log and
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
            >
              {pending ? "Deleting…" : "Delete forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
