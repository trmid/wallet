import type { Address } from 'viem'

export const shortAddress = (address: Address) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}
