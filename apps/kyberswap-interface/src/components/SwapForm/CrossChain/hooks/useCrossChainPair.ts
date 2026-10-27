import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useCurrencyV2 } from 'hooks/useTokens'
import { useNearIntentsTokens } from 'pages/CrossChainSwap/adapters/NearIntentsAdapter/useNearIntentsTokens'
import { BitcoinToken, Chain, NonEvmChain, isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import { useSolanaTokens } from 'pages/CrossChainSwap/hooks/useSolanaTokens'

type Props = {
  fromChainId: Chain
  toChainId: Chain
  tokenIn: string
  tokenOut: string
}

/** Resolves metadata for the pair owned by the unified form; it never changes the URL or selection. */
export const useCrossChainPair = ({ fromChainId, toChainId, tokenIn, tokenOut }: Props) => {
  const { nearTokens } = useNearIntentsTokens()
  const isFromEvm = isEvmChain(fromChainId)
  const isToEvm = isEvmChain(toChainId)
  const isFromNear = fromChainId === NonEvmChain.Near
  const isToNear = toChainId === NonEvmChain.Near
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin
  const isToBitcoin = toChainId === NonEvmChain.Bitcoin
  const isFromSolana = fromChainId === NonEvmChain.Solana
  const isToSolana = toChainId === NonEvmChain.Solana

  const currencyInEvm = useCurrencyV2(isFromEvm ? tokenIn : undefined, isFromEvm ? (fromChainId as ChainId) : undefined)

  const { solanaTokens: solanaTokensIn } = useSolanaTokens(isFromSolana ? tokenIn || '' : '', !isFromSolana)
  const { solanaTokens: solanaTokensOut } = useSolanaTokens(isToSolana ? tokenOut || '' : '', !isToSolana)

  const currencyIn = useMemo(() => {
    if (isFromEvm) return currencyInEvm
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    if (isFromSolana) return solanaTokensIn.find(token => token.id === tokenIn)
    throw new Error('Network is not supported')
  }, [currencyInEvm, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens, isFromSolana, solanaTokensIn])

  const currencyOutEvm = useCurrencyV2(isToEvm ? tokenOut : undefined, isToEvm ? (toChainId as ChainId) : undefined)

  const currencyOut = useMemo(() => {
    if (isToEvm) return currencyOutEvm
    if (isToBitcoin) return BitcoinToken
    if (isToNear) return nearTokens.find(token => token.assetId === tokenOut)
    if (isToSolana) return solanaTokensOut.find(token => token.id === tokenOut)
    throw new Error('Network is not supported')
  }, [currencyOutEvm, isToEvm, tokenOut, isToNear, isToBitcoin, nearTokens, solanaTokensOut, isToSolana])

  return {
    pairKey: JSON.stringify([fromChainId, toChainId, tokenIn, tokenOut]),
    fromChainId,
    toChainId,
    currencyIn: currencyIn || undefined,
    currencyOut: currencyOut || undefined,
    nearTokens,
  }
}

export type CrossChainPair = ReturnType<typeof useCrossChainPair>
