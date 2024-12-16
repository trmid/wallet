import type { BundlerClient } from 'viem/account-abstraction'
import type { TX } from './types'
import { chainInfo, paymasterAddress, primaryTokenAddress } from '../config'
import { parseAbi, encodeFunctionData } from 'viem'
import type { PimlicoClient } from 'permissionless/clients/pimlico'

const gasApprovalTx = (gasCostLimit: bigint) => {
  return {
    to: primaryTokenAddress,
    data: encodeFunctionData({
      abi: parseAbi(['function approve(address,uint256) view']),
      functionName: 'approve',
      args: [paymasterAddress, BigInt(gasCostLimit)]
    })
  }
}

export const sendTxs = async (bundlerClient: BundlerClient, txs: TX[], gasCostLimit: bigint) => {
  const userOpHash = await bundlerClient.sendUserOperation({
    paymasterContext: {
      token: primaryTokenAddress
    },
    calls: [gasApprovalTx(gasCostLimit), ...txs]
  })
  const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash })
  console.log(receipt)
  return receipt
}

export const estimateGasCost = async (bundlerClient: BundlerClient, txs: TX[]) => {
  if (!bundlerClient.account) throw new Error('Missing account in bundler client...')
  const pimlicoClient = bundlerClient.paymaster as PimlicoClient
  const quotes = await pimlicoClient.getTokenQuotes({
    chain: chainInfo,
    tokens: [primaryTokenAddress]
  })

  const postOpGas: bigint = quotes[0].postOpGas
  const exchangeRate: bigint = quotes[0].exchangeRate
  const op = await bundlerClient.prepareUserOperation({
    account: bundlerClient.account,
    paymasterContext: {
      token: primaryTokenAddress
    },
    calls: [gasApprovalTx(2n ** 256n - 1n), ...txs]
  })

  const verificationGasLimit = op.verificationGasLimit < 20_000n ? op.verificationGasLimit : 20_000n // use lower gas limit since pimlico heavily over-estimates
  const userOperationMaxGas =
    op.preVerificationGas +
    verificationGasLimit +
    op.callGasLimit +
    ((op as any)?.paymasterVerificationGasLimit || 0n) +
    ((op as any)?.paymasterPostOpGasLimit || 0n)
  const userOperationMaxCost = userOperationMaxGas * op.maxFeePerGas
  const maxCostInWei = userOperationMaxCost + postOpGas * op.maxFeePerGas
  const maxCostInTokenRaw = (maxCostInWei * exchangeRate) / BigInt(1e18)

  return maxCostInTokenRaw
}
