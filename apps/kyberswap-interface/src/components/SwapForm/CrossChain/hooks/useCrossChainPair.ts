import { ChainId } from '@kyberswap/ks-sdk-core'
import { useMemo } from 'react'

import { useNearIntentsTokens } from 'hooks/useNearIntentsTokens'
import { useSolanaTokens } from 'hooks/useSolanaTokens'
import { useCurrencyV2WithLoading } from 'hooks/useTokens'
import { BitcoinToken, Chain, NonEvmChain, isEvmChain } from 'types/crossChain'

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

  const inputEvm = useCurrencyV2WithLoading(
    isFromEvm ? tokenIn : undefined,
    isFromEvm ? (fromChainId as ChainId) : undefined,
  )
  const outputEvm = useCurrencyV2WithLoading(
    isToEvm ? tokenOut : undefined,
    isToEvm ? (toChainId as ChainId) : undefined,
  )

  const { solanaTokens: solanaTokensIn, isLoadingSolanaTokens: isLoadingSolanaIn } = useSolanaTokens(
    isFromSolana ? tokenIn || '' : '',
    !isFromSolana,
  )
  const { solanaTokens: solanaTokensOut, isLoadingSolanaTokens: isLoadingSolanaOut } = useSolanaTokens(
    isToSolana ? tokenOut || '' : '',
    !isToSolana,
  )

  const currencyIn = useMemo(() => {
    if (!tokenIn) return undefined
    if (isFromEvm) return inputEvm.currency
    if (isFromBitcoin) return BitcoinToken
    if (isFromNear) return nearTokens.find(token => token.assetId === tokenIn)
    if (isFromSolana) return solanaTokensIn.find(token => token.id === tokenIn)
    throw new Error('Network is not supported')
  }, [inputEvm.currency, isFromBitcoin, isFromNear, isFromEvm, tokenIn, nearTokens, isFromSolana, solanaTokensIn])

  const currencyOut = useMemo(() => {
    if (!tokenOut) return undefined
    if (isToEvm) return outputEvm.currency
    if (isToBitcoin) return BitcoinToken
    if (isToNear) return nearTokens.find(token => token.assetId === tokenOut)
    if (isToSolana) return solanaTokensOut.find(token => token.id === tokenOut)
    throw new Error('Network is not supported')
  }, [outputEvm.currency, isToEvm, tokenOut, isToNear, isToBitcoin, nearTokens, solanaTokensOut, isToSolana])

  return {
    pairKey: JSON.stringify([fromChainId, toChainId, tokenIn, tokenOut]),
    fromChainId,
    toChainId,
    currencyIn: currencyIn || undefined,
    currencyOut: currencyOut || undefined,
    isInputCurrencyLoading:
      Boolean(tokenIn) &&
      (inputEvm.isLoading || (isFromSolana && isLoadingSolanaIn) || (isFromNear && nearTokens.length === 0)),
    isOutputCurrencyLoading:
      Boolean(tokenOut) &&
      (outputEvm.isLoading || (isToSolana && isLoadingSolanaOut) || (isToNear && nearTokens.length === 0)),
    nearTokens,
  }
}

export type CrossChainPair = ReturnType<typeof useCrossChainPair>
