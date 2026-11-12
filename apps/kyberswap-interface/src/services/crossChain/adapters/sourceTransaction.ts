import { getPublicClient } from '@wagmi/core'

import { wagmiConfig } from 'components/Web3Provider/config'
import type { NormalizedTxResponse } from 'types/crossChain'

// A successful source receipt does not prove cross-chain completion; only a revert is terminal here.
export const isSourceTransactionReverted = async ({
  sourceChain,
  sourceTxHash,
}: Pick<NormalizedTxResponse, 'sourceChain' | 'sourceTxHash'>): Promise<boolean> => {
  if (typeof sourceChain !== 'number' || !sourceTxHash?.startsWith('0x')) return false

  try {
    const client = getPublicClient(wagmiConfig, { chainId: sourceChain })
    const receipt = await client?.getTransactionReceipt({ hash: sourceTxHash as `0x${string}` })
    return receipt?.status === 'reverted'
  } catch {
    // Pending receipts or unavailable RPCs must not prevent the provider status lookup.
    return false
  }
}
