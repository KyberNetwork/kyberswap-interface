import { ChainId } from '@kyberswap/ks-sdk-core'

import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO, isSupportedChainId } from 'constants/networks'
import { DEFAULT_OUTPUT_TOKENS, NativeCurrencies } from 'constants/tokens'
import { Chain, NonEvmChain, isNonEvmChain } from 'pages/Swap/crossChain/adapters/types'
import { SOLANA_NATIVE } from 'pages/Swap/crossChain/utils'

export type SwapPair = { fromChain: Chain; toChain: Chain; tokenIn: string; tokenOut: string }

export const isCrossChainPair = (from: Chain, to: Chain) => from !== to || typeof from !== 'number'

/** Write one pair representation: a path for single-chain, query parameters for cross-chain. */
export const getTradeLocation = (
  page: 'swap' | 'limit' | 'stop-market' | 'cross-chain' | 'kybercross',
  pair: SwapPair,
  params = new URLSearchParams(),
) => {
  const search = new URLSearchParams(params)
  for (const key of ['chainId', 'toChain', 'inputCurrency', 'outputCurrency']) search.delete(key)
  const crossChain =
    page === 'kybercross' ||
    page === 'cross-chain' ||
    (page === 'swap' && isCrossChainPair(pair.fromChain, pair.toChain))
  let pathname: string
  if (crossChain) {
    pathname = page === 'kybercross' ? APP_PATHS.KYBER_CROSS : APP_PATHS.SWAP
    search.set('from', String(pair.fromChain))
    search.set('to', String(pair.toChain))
    search.set('tokenIn', pair.tokenIn)
    search.set('tokenOut', pair.tokenOut)
  } else {
    for (const key of ['from', 'to', 'tokenIn', 'tokenOut']) search.delete(key)
    const network = NETWORKS_INFO[pair.fromChain as ChainId].route
    const tokenIn = encodeURIComponent(pair.tokenIn.toLowerCase())
    const tokenOut = encodeURIComponent(pair.tokenOut.toLowerCase())
    pathname = `${
      page === 'limit' ? APP_PATHS.LIMIT : page === 'stop-market' ? APP_PATHS.STOP_MARKET : APP_PATHS.SWAP
    }/${network}/${tokenIn}-to-${tokenOut}`
  }
  return { pathname, search: search.size ? `?${search.toString()}` : '' }
}

export const getSwapChains = (params: URLSearchParams, fallback: ChainId) => {
  const readChain = (value: string | null): Chain => {
    if (isNonEvmChain(value as NonEvmChain)) return value as NonEvmChain
    const chainId = Number(value) as ChainId
    return isSupportedChainId(chainId) ? chainId : fallback
  }
  const fromChain = readChain(params.get('from'))
  const toChain = readChain(params.get('to'))

  return {
    fromChain,
    toChain,
    // Non-EVM pairs continue to use the existing cross-chain wallet/adapter flow.
    isCrossChain: isCrossChainPair(fromChain, toChain),
  }
}

export const getDefaultSwapTokenId = (chain: Chain): string => {
  if (chain === NonEvmChain.Bitcoin) return 'BTC'
  if (chain === NonEvmChain.Near) return 'near'
  if (chain === NonEvmChain.Solana) return SOLANA_NATIVE
  return NativeCurrencies[chain].symbol?.toLowerCase() || ''
}

/** Partner retains its legacy token fields; an optional destination chain enables cross-chain swaps. */
export const getEmbeddedSwapPair = (params: URLSearchParams): SwapPair => {
  const readChain = (value: string | null, fallback: Chain): Chain => {
    if (isNonEvmChain(value as NonEvmChain)) return value as NonEvmChain
    const chain = Number(value)
    return isSupportedChainId(chain) ? chain : fallback
  }
  const fromChain = readChain(params.get('chainId'), ChainId.MAINNET)
  const toChain = params.get('tab') === 'limit' ? fromChain : readChain(params.get('toChain'), fromChain)
  return {
    fromChain,
    toChain,
    tokenIn: params.get('inputCurrency') || getDefaultSwapTokenId(fromChain),
    tokenOut:
      params.get('outputCurrency') ||
      (typeof toChain === 'number' && fromChain === toChain
        ? DEFAULT_OUTPUT_TOKENS[toChain]?.wrapped.address || ''
        : getDefaultSwapTokenId(toChain)),
  }
}

/** Every embedded pair write uses one schema and preserves attribution and fee parameters. */
export const getEmbeddedSwapSearchParams = (pair: SwapPair, params: URLSearchParams) => {
  const next = new URLSearchParams(params)
  for (const key of ['from', 'to', 'tokenIn', 'tokenOut']) next.delete(key)
  next.set('chainId', String(pair.fromChain))
  if (pair.fromChain === pair.toChain) next.delete('toChain')
  else next.set('toChain', String(pair.toChain))
  next.set('inputCurrency', pair.tokenIn)
  next.set('outputCurrency', pair.tokenOut)
  return next
}
