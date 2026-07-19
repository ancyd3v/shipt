export const SHIPSTAKE_ADDRESS = "0x9A0d27bcD3fC9FF856de00ffF2681b4B9a4D6797" as const;

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

export const MONAD_EXPLORER_URL = "https://testnet.monadexplorer.com";

export function explorerTxUrl(hash: string) {
  return `${MONAD_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${MONAD_EXPLORER_URL}/address/${address}`;
}

export const SHIPSTAKE_ABI = [
  {
    inputs: [
      { internalType: "address", name: "_resolver", type: "address" },
      { internalType: "address", name: "_forfeiturePool", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  { inputs: [], name: "AlreadyResolved", type: "error" },
  { inputs: [], name: "DeadlineInPast", type: "error" },
  { inputs: [], name: "InvalidStake", type: "error" },
  { inputs: [], name: "NoStakeValue", type: "error" },
  { inputs: [], name: "NotResolver", type: "error" },
  { inputs: [], name: "NotYetExpired", type: "error" },
  { inputs: [], name: "TransferFailed", type: "error" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "stakeId", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "StakeCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "stakeId", type: "uint256" },
      { indexed: false, internalType: "bool", name: "shipped", type: "bool" },
    ],
    name: "StakeResolved",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
    name: "claimExpired",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "deadline", type: "uint256" }],
    name: "createStake",
    outputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "stakeId", type: "uint256" }],
    name: "getStake",
    outputs: [
      {
        components: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "bool", name: "resolved", type: "bool" },
          { internalType: "bool", name: "shipped", type: "bool" },
        ],
        internalType: "struct ShipStake.Stake",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "stakeId", type: "uint256" },
      { internalType: "bool", name: "shipped", type: "bool" },
    ],
    name: "resolve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
