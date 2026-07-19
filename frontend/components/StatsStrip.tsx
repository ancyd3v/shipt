"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import { BACKEND_URL } from "@/lib/contract";

type Stake = {
  amountWei: string;
  resolved: boolean;
  shipped: boolean | null;
};

export function StatsStrip({ refreshKey }: { refreshKey: number }) {
  const [mounted, setMounted] = useState(false);
  const { address } = useAccount();
  const [stakes, setStakes] = useState<Stake[]>([]);

  useEffect(() => setMounted(true), []);

  const load = useCallback(async () => {
    if (!address) return;
    try {
      const res = await fetch(`${BACKEND_URL}/stakes?ownerAddress=${address}`);
      if (res.ok) setStakes(await res.json());
    } catch {
      // ignore, retried on next refresh
    }
  }, [address]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!mounted || !address || stakes.length === 0) return null;

  const totalStaked = stakes.reduce((sum, s) => sum + Number(s.amountWei), 0) / 1e18;
  const shipped = stakes.filter((s) => s.resolved && s.shipped).length;
  const forfeited = stakes.filter((s) => s.resolved && s.shipped === false).length;

  return (
    <div className="mb-8 flex gap-6 text-sm">
      <div>
        <div className="text-2xl font-semibold">{totalStaked.toFixed(3)}</div>
        <div className="text-muted">MON staked</div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-moss">{shipped}</div>
        <div className="text-muted">Shipped</div>
      </div>
      <div>
        <div className="text-2xl font-semibold text-rust">{forfeited}</div>
        <div className="text-muted">Forfeited</div>
      </div>
    </div>
  );
}
