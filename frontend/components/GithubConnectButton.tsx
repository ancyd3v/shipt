"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BACKEND_URL } from "@/lib/contract";
import { saveGithubSession, getGithubSession, clearGithubSession, type GithubSession } from "@/lib/github-auth";

export function GithubConnectButton({
  onSessionChange,
}: {
  onSessionChange: (session: GithubSession | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<GithubSession | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const ghToken = searchParams.get("gh_token");
    const ghUsername = searchParams.get("gh_username");
    const ghError = searchParams.get("gh_error");

    if (ghToken && ghUsername) {
      const newSession = { username: ghUsername, token: ghToken };
      saveGithubSession(newSession);
      setSession(newSession);
      onSessionChange(newSession);
      router.replace("/");
      return;
    }

    if (ghError) {
      router.replace("/");
      return;
    }

    const existing = getGithubSession();
    setSession(existing);
    onSessionChange(existing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) {
    return (
      <button disabled className="glass-row rounded-full px-4 py-2 text-sm font-medium opacity-50">
        Connect GitHub
      </button>
    );
  }

  if (session) {
    return (
      <button
        onClick={() => {
          clearGithubSession();
          setSession(null);
          onSessionChange(null);
        }}
        className="glass-row rounded-full px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-white/10"
      >
        @{session.username}
      </button>
    );
  }

  return (
    <a
      href={`${BACKEND_URL}/auth/github/login`}
      className="glass-row rounded-full px-4 py-2 text-sm font-medium text-paper transition-colors hover:border-purple hover:text-purple"
    >
      Connect GitHub
    </a>
  );
}
