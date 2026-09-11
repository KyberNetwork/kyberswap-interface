import { fetchTokenCategories, fetchTokenPrices } from 'services/tokenCatalog'

import { Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { isEvmChain } from 'pages/CrossChainSwap/adapters/types'
import {
  PairCategory,
  TokenPricesResponse,
  getTokenMidPriceUsd,
  isEvmCurrency,
  isStableCurrency,
} from 'pages/CrossChainSwap/quote/utils'
import { isCanonicalPair } from 'pages/CrossChainSwap/utils'

type SameAssetRequest = {
  abort: () => void
  unwrap: () => Promise<boolean>
}

type CheckSameAsset = (params: {
  chainIdA: number | string
  addressA: string
  chainIdB: number | string
  addressB: string
}) => SameAssetRequest

type PairInfoParams = {
  currencyIn: Currency
  currencyOut: Currency
  fromChainId: Chain
  toChainId: Chain
  checkSameAsset: CheckSameAsset
  signal: AbortSignal
}

export type PairInfo = {
  category: PairCategory
  feeBps: number
  tokenInUsd: number
  tokenOutUsd: number
}

type EvmPairInfoParams = {
  isCanonicalPair: boolean
  isSameAsset: boolean
  tokenInCategory: string
  tokenOutCategory: string
  isTokenInStable: boolean
  isTokenOutStable: boolean
}

// EVM fee matrix priority: canonical/same asset → high volatility → exotic →
// stable (both catalog categories or both token flags) → common.
export const getEvmPairInfo = ({
  isCanonicalPair,
  isSameAsset,
  tokenInCategory,
  tokenOutCategory,
  isTokenInStable,
  isTokenOutStable,
}: EvmPairInfoParams): Pick<PairInfo, 'category' | 'feeBps'> => {
  if (isCanonicalPair || isSameAsset) return { category: 'stablePair', feeBps: 5 }
  if (tokenInCategory === 'highVolatilityPair' || tokenOutCategory === 'highVolatilityPair') {
    return { category: 'highVolatilityPair', feeBps: 25 }
  }
  if (tokenInCategory === 'exoticPair' || tokenOutCategory === 'exoticPair') {
    return { category: 'exoticPair', feeBps: 15 }
  }
  if (
    (tokenInCategory === 'stablePair' && tokenOutCategory === 'stablePair') ||
    (isTokenInStable && isTokenOutStable)
  ) {
    return { category: 'stablePair', feeBps: 5 }
  }
  return { category: 'commonPair', feeBps: 10 }
}

const unwrapQueryWithAbortSignal = async <T>(
  request: { abort: () => void; unwrap: () => Promise<T> },
  signal: AbortSignal,
): Promise<T> => {
  signal.addEventListener('abort', request.abort, { once: true })
  try {
    return await request.unwrap()
  } finally {
    signal.removeEventListener('abort', request.abort)
  }
}

export const getPairInfo = async ({
  currencyIn,
  currencyOut,
  fromChainId,
  toChainId,
  checkSameAsset,
  signal,
}: PairInfoParams): Promise<PairInfo | null> => {
  const isFromEvm = isEvmChain(fromChainId)
  const isToEvm = isEvmChain(toChainId)
  const isFromBitcoin = fromChainId === NonEvmChain.Bitcoin
  const isToBitcoin = toChainId === NonEvmChain.Bitcoin
  const isFromNear = fromChainId === NonEvmChain.Near
  const isToNear = toChainId === NonEvmChain.Near
  const isFromSolana = fromChainId === NonEvmChain.Solana
  const isToSolana = toChainId === NonEvmChain.Solana

  const priceRequestBody: Record<string, string[]> = {}
  if (isEvmCurrency(currencyIn)) {
    priceRequestBody[fromChainId] = [currencyIn.wrapped.address]
  }
  if (isEvmCurrency(currencyOut)) {
    priceRequestBody[toChainId] = [...(priceRequestBody[toChainId] || []), currencyOut.wrapped.address]
  }

  const isEvmPair = isEvmCurrency(currencyIn) && isEvmCurrency(currencyOut)
  const isCanonicalEvmPair =
    isEvmPair &&
    isCanonicalPair(currencyIn.chainId, currencyIn.wrapped.address, currencyOut.chainId, currencyOut.wrapped.address)
  const shouldCheckSameAsset = isEvmPair && !isCanonicalEvmPair && currencyIn.chainId !== currencyOut.chainId

  const isSameAssetPromise = shouldCheckSameAsset
    ? unwrapQueryWithAbortSignal(
        checkSameAsset({
          chainIdA: currencyIn.chainId,
          addressA: currencyIn.wrapped.address,
          chainIdB: currencyOut.chainId,
          addressB: currencyOut.wrapped.address,
        }),
        signal,
      ).catch(error => {
        if (!signal.aborted) console.error('Failed to check whether tokens are the same asset:', error)
        return false
      })
    : Promise.resolve(false)

  let pricesResponse: TokenPricesResponse | null = null
  try {
    pricesResponse = await fetchTokenPrices(priceRequestBody, { signal })
  } catch (error) {
    if (signal.aborted) return null
    console.error('Failed to fetch token prices:', error)
  }

  if (signal.aborted) return null
  const isSameAsset = await isSameAssetPromise
  if (signal.aborted) return null

  const tokenInUsd = isEvmCurrency(currencyIn)
    ? getTokenMidPriceUsd(pricesResponse?.data?.[fromChainId]?.[currencyIn.wrapped.address])
    : 0
  const tokenOutUsd = isEvmCurrency(currencyOut)
    ? getTokenMidPriceUsd(pricesResponse?.data?.[toChainId]?.[currencyOut.wrapped.address])
    : 0

  let feeBps = 25
  let category: PairCategory = 'commonPair'
  if (isFromBitcoin || isToBitcoin) {
    feeBps = 25
  } else if (isFromEvm && isToEvm) {
    let tokenInCategory = ''
    let tokenOutCategory = ''
    if (!isCanonicalEvmPair && !isSameAsset) {
      const currencyInAddress = isEvmCurrency(currencyIn) ? currencyIn.wrapped.address.toLowerCase() : ''
      const currencyOutAddress = isEvmCurrency(currencyOut) ? currencyOut.wrapped.address.toLowerCase() : ''
      const categories = await Promise.all([
        fetchTokenCategories({ chainId: fromChainId, tokens: currencyInAddress }, { signal }).then(
          items => items.find(item => item.token.toLowerCase() === currencyInAddress)?.category || 'exoticPair',
        ),
        fetchTokenCategories({ chainId: toChainId, tokens: currencyOutAddress }, { signal }).then(
          items => items.find(item => item.token.toLowerCase() === currencyOutAddress)?.category || 'exoticPair',
        ),
      ])
      tokenInCategory = categories[0]
      tokenOutCategory = categories[1]
    }

    const evmPairInfo = getEvmPairInfo({
      isCanonicalPair: isCanonicalEvmPair,
      isSameAsset,
      tokenInCategory,
      tokenOutCategory,
      isTokenInStable: isStableCurrency(currencyIn, fromChainId),
      isTokenOutStable: isStableCurrency(currencyOut, toChainId),
    })
    category = evmPairInfo.category
    feeBps = evmPairInfo.feeBps
  } else if (isFromNear || isToNear || isFromSolana || isToSolana) {
    const isTokenInStable = isStableCurrency(currencyIn, fromChainId)
    const isTokenOutStable = isStableCurrency(currencyOut, toChainId)

    if (!isFromEvm && !isToEvm) feeBps = 25
    else if (isTokenInStable && isTokenOutStable) feeBps = 10
    else feeBps = 20
  }

  return { category, feeBps, tokenInUsd, tokenOutUsd }
}
