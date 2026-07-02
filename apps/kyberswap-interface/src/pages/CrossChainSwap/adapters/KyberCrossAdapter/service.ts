import { ChainId } from '@kyberswap/ks-sdk-core'
import {
  type Address,
  type Hash,
  type Chain as ViemChain,
  WalletClient,
  createPublicClient,
  encodeFunctionData,
  http,
  maxUint256,
  parseAbi,
} from 'viem'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import type { ExecutionTx } from 'pages/CrossChainSwap/adapters/KyberCrossAdapter/api'

export interface ExecuteParams {
  walletClient: WalletClient
  originChain: ViemChain
  userAddress: Address
  buildTx: ExecutionTx
  inputToken: Address
  inputAmount: bigint
  isNativeToken: boolean
  infiniteApproval?: boolean
}

export const executeKyberCross = async (params: ExecuteParams): Promise<Hash> => {
  const {
    walletClient,
    originChain,
    userAddress,
    buildTx,
    inputToken,
    inputAmount,
    isNativeToken,
    infiniteApproval = false,
  } = params
  const value = BigInt(buildTx.value)
  const account = walletClient.account

  if (!account) {
    throw new Error('Wallet account not connected')
  }

  const rpcUrl = NETWORKS_INFO[originChain.id as ChainId]?.defaultRpcUrl
  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chain: ${originChain.id}`)
  }

  const originClient = createPublicClient({
    chain: originChain,
    transport: http(rpcUrl),
  })

  if (!isNativeToken) {
    const allowance = await originClient.readContract({
      address: inputToken,
      abi: parseAbi(['function allowance(address owner, address spender) public view returns (uint256)']),
      functionName: 'allowance',
      args: [userAddress, buildTx.to],
    })

    if (inputAmount > allowance) {
      const approvalAmount = infiniteApproval ? maxUint256 : inputAmount
      const approveCalldata = encodeFunctionData({
        abi: parseAbi(['function approve(address spender, uint256 value)']),
        args: [buildTx.to, approvalAmount],
      })

      const approveTxHash = await walletClient.sendTransaction({
        account,
        chain: originChain,
        to: inputToken,
        data: approveCalldata,
      })

      await originClient.waitForTransactionReceipt({
        hash: approveTxHash,
      })
    }
  }

  await originClient.call({
    to: buildTx.to,
    data: buildTx.data,
    value,
    account,
  })

  return walletClient.sendTransaction({
    account,
    to: buildTx.to,
    data: buildTx.data,
    value,
    chain: originChain,
  })
}
