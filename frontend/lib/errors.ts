export function friendlyWalletError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("User rejected") || message.includes("user rejected")) {
    return "You rejected the transaction in your wallet.";
  }
  if (message.includes("insufficient funds")) {
    return "Not enough MON in your wallet to cover the stake plus gas.";
  }
  if (message.includes("AlreadyResolved")) {
    return "This stake was already resolved.";
  }
  if (message.includes("InvalidStake")) {
    return "This stake doesn't exist on-chain.";
  }
  if (message.includes("NotYetExpired")) {
    return "The deadline hasn't passed yet — can't claim as expired.";
  }

  // Fall back to just the first line, so viem's multi-page error dumps
  // never get dumped raw into the UI.
  const firstLine = message.split("\n")[0].trim();
  return firstLine.length > 0 && firstLine.length < 150
    ? firstLine
    : "Something went wrong submitting the transaction.";
}
