import { formatUnits, type Address } from 'viem'
import { base } from 'viem/chains'

export const chainInfo = base
export const primaryTokenAddress: Address = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
export const primaryTokenDecimals = 6
export const paymasterAddress: Address = '0x00000000000000fb866daaa79352cc568a005d96'
export const defaultTxCostLimit: bigint = 100000n // in primary token value
export const formatPrimaryToken: (balance: bigint) => string = (balance) => {
  const formatter = new Intl.NumberFormat(navigator.language || 'en-US', {
    style: 'currency',
    currency: 'USD',
    trailingZeroDisplay: 'stripIfInteger'
  })
  return formatter.format(parseFloat(formatUnits(balance, primaryTokenDecimals)))
}
