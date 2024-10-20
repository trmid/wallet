import { parseAbi, type Address, type PublicClient } from 'viem'

const cacheTimeMs = 5_000

const balanceMap: Map<`${Address}-${Address}`, { balance: bigint; queriedAtTimestamp: number }> =
  new Map()

export const getBalance = async (
  client: PublicClient,
  tokenAddress: Address,
  accountAddress: Address
) => {
  const now = Date.now()
  const balanceKey =
    `${tokenAddress.toLowerCase()}-${accountAddress.toLowerCase()}` as `${Address}-${Address}`
  let balanceInfo = balanceMap.get(balanceKey)
  if (balanceInfo && now - balanceInfo.queriedAtTimestamp < cacheTimeMs) {
    return balanceInfo.balance
  } else {
    const balance = await client.readContract({
      address: tokenAddress,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [accountAddress]
    })
    balanceInfo = {
      balance,
      queriedAtTimestamp: now
    }
    balanceMap.set(balanceKey, balanceInfo)
    return balance
  }
}
