"use client";

import { Suspense, useState } from "react";
import { ConnectButton } from "@/components/ConnectButton";
import { GithubConnectButton } from "@/components/GithubConnectButton";
import { StakeForm } from "@/components/StakeForm";
import { StakeList } from "@/components/StakeList";
import { StatsStrip } from "@/components/StatsStrip";
import type { GithubSession } from "@/lib/github-auth";

export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [githubSession, setGithubSession] = useState<GithubSession | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="glow-orb" style={{ width: 500, height: 500, top: -150, left: -150 }} />
      <div className="glow-orb" style={{ width: 400, height: 400, top: 200, right: -150 }} />

      <nav className="glass-nav fixed inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-4">
        <div className="font-display text-xl font-semibold tracking-tight">
          ShipStake
        </div>
        <div className="flex items-center gap-3">
          <Suspense fallback={null}>
            <GithubConnectButton onSessionChange={setGithubSession} />
          </Suspense>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-8 pb-20 pt-28">
        <h1 className="mb-3 font-display text-4xl font-semibold tracking-tight">
          Stake on shipping it.
        </h1>
        <p className="mb-6 max-w-lg text-lg text-muted">
          Put MON behind a real PR and a real deadline. Ship it, get it back. Miss it, it&apos;s gone.
        </p>

        <StatsStrip refreshKey={refreshKey} />

        <div className="grid gap-6 md:grid-cols-2">
          <StakeForm
            githubSession={githubSession}
            onStakeCreated={() => setRefreshKey((k) => k + 1)}
          />
          <StakeList refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  );
}
