import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type PublicClient,
  type WalletClient,
  type Chain,
  type HttpTransport,
} from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.MONAD_TESTNET_RPC_URL as string] },
  },
});

export const resolverAccount: PrivateKeyAccount = privateKeyToAccount(
  process.env.MONAD_RESOLVER_PRIVATE_KEY as `0x${string}`,
);

export const publicClient: PublicClient<HttpTransport, Chain> = createPublicClient({
  chain: monadTestnet,
  transport: http(process.env.MONAD_TESTNET_RPC_URL),
});

export const walletClient: WalletClient<HttpTransport, Chain, PrivateKeyAccount> =
  createWalletClient({
    account: resolverAccount,
    chain: monadTestnet,
    transport: http(process.env.MONAD_TESTNET_RPC_URL),
  });

export const SHIPSTAKE_ADDRESS = process.env.SHIPSTAKE_CONTRACT_ADDRESS as `0x${string}`;