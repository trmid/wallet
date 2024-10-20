import type { BundlerClient } from 'viem/account-abstraction'
import type { TX } from './types'
import { maxGasCost } from './stores'
import { get } from 'svelte/store'
import { paymasterAddress, primaryTokenAddress } from '../config'
import { parseAbi, encodeFunctionData } from 'viem'

export const sendTxs = async (bundlerClient: BundlerClient, txs: TX[]) => {
  const userOpHash = await bundlerClient.sendUserOperation({
    paymasterContext: {
      token: primaryTokenAddress
    },
    calls: [
      {
        to: primaryTokenAddress,
        data: encodeFunctionData({
          abi: parseAbi(['function approve(address,uint256) view']),
          functionName: 'approve',
          args: [paymasterAddress, BigInt(get(maxGasCost))]
        })
      },
      ...txs
    ]
  })
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash })
  console.log(receipt)
  return receipt
}
