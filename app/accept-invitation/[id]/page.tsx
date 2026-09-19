"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

type Invitation = {
  id: string;
  email: string;
  status: string;
  organizationId: string;
  organizationName?: string;
  inviterEmail?: string;
};

export default function AcceptInvitationPage() {
  const params = useParams<{ id: string }>();
  const invitationId = params.id;
  const router = useRouter();
  const { data: session, isPending: sessionPending } =
    authClient.useSession();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (sessionPending || !session || done) return;
    authClient.organization
      .getInvitation({ query: { id: invitationId } })
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          setError(
            error?.message ?? "This invitation is invalid or has expired."
          );
          return;
        }
        setInvitation(data as Invitation);
      });
  }, [sessionPending, session, invitationId, done]);

  async function handleAccept() {
    setError(null);
    setDone(true);
    setAccepting(true);
    const { data, error } = await authClient.organization.acceptInvitation({
      invitationId,
    });
    if (error) {
      setAccepting(false);
      setError(error.message ?? "Failed to accept invitation.");
      return;
    }
    const organizationId =
      (data as { member?: { organizationId?: string } } | null)?.member
        ?.organizationId ?? invitation?.organizationId;
    if (!organizationId) {
      setAccepting(false);
      setError("Accepted, but the workspace could not be determined.");
      return;
    }
    const { error: activeError } =
      await authClient.organization.setActive({ organizationId });
    if (activeError) {
      setAccepting(false);
      setError(
        activeError.message ??
          "Invitation accepted, but failed to switch workspace."
      );
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-zinc-950 antialiased dark:bg-black dark:text-zinc-50">
      <header className="border-b border-zinc-200/70 dark:border-white/10">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-sm text-white dark:bg-white dark:text-black">
              V
            </span>
            Acme SaaS
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Team invitation</CardTitle>
            <CardDescription>
              {sessionPending || loading
                ? "Loading invitation…"
                : `${invitation?.organizationName ?? "A workspace"} invited you to join.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error ? (
              <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            ) : null}

            {!sessionPending && !session ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Sign in to accept this invitation. Use the same email address
                  the invitation was sent to.
                </p>
                <Link
                  href="/login"
                  className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Sign in
                </Link>
              </>
            ) : null}

            {session && invitation ? (
              session.user.email !== invitation.email ? (
                <p className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                  You are signed in as {session.user.email}, but this
                  invitation is for {invitation.email}. Sign in with the
                  matching account.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex h-11 items-center justify-center rounded-full bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {accepting ? "Accepting…" : "Accept invitation"}
                </button>
              )
            ) : null}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
