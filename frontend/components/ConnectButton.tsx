"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/wagmi";

export function ConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button disabled className="rounded-full bg-purple px-5 py-2 text-sm font-medium text-white opacity-50">
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address && chainId !== monadTestnet.id) {
    return (
      <button
        onClick={() => switchChain({ chainId: monadTestnet.id })}
        disabled={isSwitching}
        className="rounded-full bg-rust px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSwitching ? "Switching…" : "Switch to Monad Testnet"}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="glass-row rounded-full px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-white/10"
      >
        {address.slice(0, 6)}···{address.slice(-4)}
      </button>
    );
  }

  if (connectors.length === 0) {
    return (
      <div className="text-sm text-rust">
        No wallet extension detected.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => connect({ connector: connectors[0] })}
        disabled={isPending}
        className="rounded-full bg-purple px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Connecting…" : "Connect Wallet"}
      </button>
      {error && (
        <div className="max-w-xs text-right text-xs text-rust">{error.message}</div>
      )}
    </div>
  );
}
