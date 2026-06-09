import { ChainId } from '@kyberswap/ks-sdk-core'
import { createPublicClient, encodeFunctionData, http, maxUint256, parseAbi } from 'viem'

import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import { CrossChainExecuteResponse, ExecuteParams } from 'pages/CrossChainSwap/adapters/KyberCrossChainAdapter/types'

export async function executeKyberCross(params: ExecuteParams): Promise<CrossChainExecuteResponse> {
  const {
    walletClient,
    originChain,
    userAddress,
    to,
    txData,
    value,
    inputToken,
    inputAmount,
    isNativeToken,
    infiniteApproval = false,
    throwOnError = false,
    onProgress,
  } = params

  const rpcUrl = NETWORKS_INFO[originChain.id as ChainId]?.defaultRpcUrl
  if (!rpcUrl) {
    throw new Error(`No RPC URL found for chain: ${originChain.id}`)
  }

  const originClient = createPublicClient({
    chain: originChain,
    transport: http(rpcUrl),
  })

  try {
    if (!isNativeToken) {
      onProgress?.({
        step: 'approve',
        status: 'checking',
      })

      const allowance = await originClient.readContract({
        address: inputToken,
        abi: parseAbi(['function allowance(address owner, address spender) public view returns (uint256)']),
        functionName: 'allowance',
        args: [userAddress, to],
      })

      if (inputAmount > allowance) {
        const approvalAmount = infiniteApproval ? maxUint256 : inputAmount

        if (!walletClient.account) {
          throw new Error('Wallet account not connected')
        }

        const approveCalldata = encodeFunctionData({
          abi: parseAbi(['function approve(address spender, uint256 value)']),
          args: [to, approvalAmount],
        })

        const approveTxHash = await walletClient.sendTransaction({
          account: walletClient.account,
          chain: originChain,
          to: inputToken,
          data: approveCalldata,
        })

        onProgress?.({
          step: 'approve',
          status: 'txPending',
          txHash: approveTxHash,
          meta: { approvalAmount, spender: to },
        })

        const approveTxReceipt = await originClient.waitForTransactionReceipt({
          hash: approveTxHash,
        })

        onProgress?.({
          step: 'approve',
          status: 'txSuccess',
          txReceipt: approveTxReceipt,
          meta: { approvalAmount, spender: to },
        })
      }
    }

    onProgress?.({
      step: 'ksExecute',
      status: 'simulationPending',
    })

    await originClient.call({
      to,
      data: txData,
      value,
      account: walletClient.account,
    })

    onProgress?.({
      step: 'ksExecute',
      status: 'simulationSuccess',
      txRequest: { to, data: txData, value },
    })

    if (!walletClient.account) {
      throw new Error('Wallet account not connected')
    }

    const txHash = await walletClient.sendTransaction({
      account: walletClient.account,
      to,
      data: txData,
      value,
      chain: originChain,
    })

    onProgress?.({
      step: 'ksExecute',
      status: 'txPending',
      txHash,
    })

    const txReceipt = await originClient.waitForTransactionReceipt({
      hash: txHash,
    })

    onProgress?.({
      step: 'ksExecute',
      status: 'txSuccess',
      txReceipt,
    })

    return {
      txReceipt,
    }
  } catch (error) {
    const executeError = error instanceof Error ? error : new Error(String(error))

    onProgress?.({
      step: 'ksExecute',
      status: 'error',
      error: executeError,
    })

    if (throwOnError) {
      throw error
    }

    return {
      txReceipt: undefined,
      error: executeError,
    }
  }
}
