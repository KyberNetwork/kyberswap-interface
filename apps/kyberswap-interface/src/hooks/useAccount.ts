import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'
import { UseAccountReturnType as UseAccountReturnTypeWagmi, useAccount as useAccountWagmi, useChainId } from 'wagmi'

import { SUPPORTED_NETWORKS } from 'constants/networks'

type ReplaceChainId<T> = T extends { chainId: number }
  ? Omit<T, 'chainId'> & { chainId: ChainId | undefined }
  : T extends { chainId: number | undefined }
  ? Omit<T, 'chainId'> & { chainId: ChainId | undefined }
  : T

type UseAccountReturnType = ReplaceChainId<UseAccountReturnTypeWagmi>

export function useAccount(): UseAccountReturnType {
  const { chainId, ...rest } = useAccountWagmi()
  const fallbackChainId = useChainId()
  const supportedChainId = SUPPORTED_NETWORKS.includes(chainId) ? chainId : fallbackChainId

  return useMemo(
    () => ({
      ...rest,
      chainId: supportedChainId,
    }),
    [rest, supportedChainId],
  )
}
