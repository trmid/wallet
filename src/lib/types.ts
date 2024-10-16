import type { Address } from 'viem'

export interface TX {
  to: Address
  data?: `0x${string}`
  value?: string
}
