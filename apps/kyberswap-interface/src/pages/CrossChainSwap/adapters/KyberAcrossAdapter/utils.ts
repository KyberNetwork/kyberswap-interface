import { type Address, type Hex } from 'viem'

import {
  RawSwapAndDepositData,
  SwapAndDepositData,
  TransferType,
} from 'pages/CrossChainSwap/adapters/KyberAcrossAdapter/types'

export function transformSwapAndDepositData(raw: RawSwapAndDepositData): SwapAndDepositData {
  return {
    submissionFees: {
      amount: BigInt(raw.submissionFees?.amount || '0'),
      recipient: raw.submissionFees?.recipient as Address,
    },
    depositData: {
      inputToken: raw.depositData?.inputToken as Address,
      outputToken: raw.depositData?.outputToken as Hex,
      outputAmount: BigInt(raw.depositData?.outputAmount || '0'),
      depositor: raw.depositData?.depositor as Address,
      recipient: raw.depositData?.recipient as Hex,
      destinationChainId: BigInt(raw.depositData?.destinationChainId || '0'),
      exclusiveRelayer: raw.depositData?.exclusiveRelayer as Hex,
      quoteTimestamp: Number(raw.depositData?.quoteTimestamp || 0),
      fillDeadline: Number(raw.depositData?.fillDeadline || 0),
      exclusivityParameter: Number(raw.depositData?.exclusivityParameter || 0),
      message: raw.depositData?.message as Hex,
    },
    swapToken: raw.swapToken as Address,
    exchange: raw.exchange as Address,
    transferType: Number(raw.transferType) as TransferType,
    swapTokenAmount: BigInt(raw.swapTokenAmount || '0'),
    minExpectedInputTokenAmount: BigInt(raw.minExpectedInputTokenAmount || '0'),
    routerCalldata: raw.routerCalldata as Hex,
    enableProportionalAdjustment: Boolean(raw.enableProportionalAdjustment),
    spokePool: raw.spokePool as Address,
    nonce: BigInt(raw.nonce || '0'),
  }
}
