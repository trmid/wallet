import { base, baseSepolia, type Chain } from 'viem/chains'

export const NETWORKS: Record<number, Chain> = {
  [base.id]: base,
  [baseSepolia.id]: baseSepolia
} as const
