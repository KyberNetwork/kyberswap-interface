import {
  AcrossClient,
  getIntegratorDataSuffix,
  parseDepositLogs,
  parseFillLogs,
  waitForDepositTx,
  waitForFillTx,
} from '@across-protocol/app-sdk'
import { type Hex, encodeFunctionData, maxUint256, parseAbi } from 'viem'

import { spokePoolPeripheryAbi } from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/abi'
import { KYBERSWAP_INTEGRATOR_ID } from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/constants'
import {
  ExecuteSwapAndBridgeParams,
  ExecuteSwapAndBridgeResponse,
  ProgressMeta,
  SwapAndBridgeProgress,
} from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/types'

export async function executeSwapAndBridge(
  acrossClient: AcrossClient,
  params: ExecuteSwapAndBridgeParams,
): Promise<ExecuteSwapAndBridgeResponse> {
  const {
    walletClient,
    originChain,
    destinationChain,
    userAddress,
    swapAndDepositData,
    spokePoolPeripheryAddress,
    destinationSpokePoolAddress,
    isNative = false,
    infiniteApproval = false,
    skipAllowanceCheck = false,
    throwOnError = true,
    onProgress,
  } = params

  const onProgressHandler = onProgress || ((progress: SwapAndBridgeProgress) => console.log('Progress:', progress))

  let currentProgress: SwapAndBridgeProgress = {
    status: 'idle',
    step: 'approve',
  }
  let currentProgressMeta: ProgressMeta

  try {
    const originClient = acrossClient.getPublicClient(originChain.id)
    const destinationClient = acrossClient.getPublicClient(destinationChain.id)

    const nonce = await originClient.getTransactionCount({
      address: userAddress,
    })

    if (!skipAllowanceCheck && !isNative) {
      const allowance = await originClient.readContract({
        address: swapAndDepositData.swapToken,
        abi: parseAbi(['function allowance(address owner, address spender) public view returns (uint256)']),
        functionName: 'allowance',
        args: [userAddress, spokePoolPeripheryAddress],
      })

      if (swapAndDepositData.swapTokenAmount > allowance) {
        const approvalAmount = infiniteApproval ? maxUint256 : swapAndDepositData.swapTokenAmount

        currentProgressMeta = {
          approvalAmount,
          spender: spokePoolPeripheryAddress,
        }

        const approveCalldata = encodeFunctionData({
          abi: parseAbi(['function approve(address spender, uint256 value)']),
          args: [spokePoolPeripheryAddress, approvalAmount],
        })

        if (!walletClient.account) {
          throw new Error('Wallet account not connected')
        }

        const approveTxHash = await walletClient.sendTransaction({
          account: walletClient.account,
          chain: originChain,
          to: swapAndDepositData.swapToken,
          data: approveCalldata,
        })

        currentProgress = {
          step: 'approve',
          status: 'txPending',
          txHash: approveTxHash,
          meta: currentProgressMeta,
        }
        onProgressHandler(currentProgress)

        const approveTxReceipt = await originClient.waitForTransactionReceipt({
          hash: approveTxHash,
        })

        currentProgress = {
          step: 'approve',
          status: 'txSuccess',
          txReceipt: approveTxReceipt,
          meta: currentProgressMeta,
        }
        onProgressHandler(currentProgress)
      }
    }

    currentProgressMeta = {
      swapAndDepositData,
    }

    currentProgress = {
      step: 'swapAndBridge',
      status: 'simulationPending',
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    const swapAndBridgeArgs = { ...swapAndDepositData, nonce: BigInt(nonce) }

    // Encode calldata for Tenderly simulation
    const calldata = encodeFunctionData({
      abi: spokePoolPeripheryAbi,
      functionName: 'swapAndBridge',
      args: [{ ...swapAndBridgeArgs }],
    })
    const dataSuffix = getIntegratorDataSuffix(KYBERSWAP_INTEGRATOR_ID)
    const fullCalldata = `${calldata}${dataSuffix.slice(2)}` as Hex // Remove 0x from suffix before concatenating

    // Log for Tenderly simulation
    console.log('🔵 🔵 🔵 🔵 🔵 🔵 🔵')
    console.log('Contract Address:', spokePoolPeripheryAddress)
    console.log('Sender (from):', userAddress)
    console.log('Value (wei):', isNative ? swapAndDepositData.swapTokenAmount.toString() : '0')
    console.log('Calldata:', fullCalldata)
    console.log('Chain ID:', originChain.id)

    const { request: txRequest } = await originClient.simulateContract({
      address: spokePoolPeripheryAddress,
      abi: spokePoolPeripheryAbi,
      functionName: 'swapAndBridge',
      args: [{ ...swapAndBridgeArgs }],
      account: walletClient.account,
      value: isNative ? swapAndDepositData.swapTokenAmount : undefined,
      dataSuffix: getIntegratorDataSuffix(KYBERSWAP_INTEGRATOR_ID),
    })

    currentProgress = {
      step: 'swapAndBridge',
      status: 'simulationSuccess',
      txRequest,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    const swapAndBridgeTxHash = await walletClient.writeContract(txRequest)

    currentProgress = {
      step: 'swapAndBridge',
      status: 'txPending',
      txHash: swapAndBridgeTxHash,
      txRequest,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    const { depositId, depositTxReceipt } = await waitForDepositTx({
      originChainId: originChain.id,
      transactionHash: swapAndBridgeTxHash,
      publicClient: originClient,
    })
    const depositLog = parseDepositLogs(depositTxReceipt.logs)

    currentProgress = {
      step: 'swapAndBridge',
      status: 'txSuccess',
      txReceipt: depositTxReceipt,
      depositId,
      depositLog,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    currentProgressMeta = {
      depositId,
    }
    currentProgress = {
      step: 'fill',
      status: 'pending',
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    const destinationBlock = await destinationClient.getBlockNumber()

    const { fillTxReceipt, fillTxTimestamp, actionSuccess } = await waitForFillTx({
      deposit: {
        originChainId: originChain.id,
        destinationChainId: destinationChain.id,
        destinationSpokePoolAddress: destinationSpokePoolAddress,
        message: swapAndDepositData.depositData.message,
      },
      depositId,
      depositTxHash: depositTxReceipt.transactionHash,
      destinationChainClient: destinationClient,
      fromBlock: destinationBlock - 100n,
    })

    const fillLog = parseFillLogs(fillTxReceipt.logs)

    currentProgress = {
      step: 'fill',
      status: 'txSuccess',
      txReceipt: fillTxReceipt,
      fillTxTimestamp,
      actionSuccess,
      fillLog,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    return {
      depositId,
      swapAndBridgeTxReceipt: depositTxReceipt,
      fillTxReceipt,
    }
  } catch (error) {
    const executeError = error instanceof Error ? error : new Error(String(error))

    currentProgress = {
      ...currentProgress,
      status: 'error',
      error: executeError,
      meta: currentProgressMeta,
    }
    onProgressHandler(currentProgress)

    if (!throwOnError) {
      return { error: executeError }
    }

    throw error
  }
}
