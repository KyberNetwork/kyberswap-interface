import { ChainId, Token, WETH } from '@kyberswap/ks-sdk-core'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { useActiveWeb3React } from 'hooks'
import { useAppSelector } from 'state/hooks'
import { NATIVE_TOKEN_PRICE_KEY, resolvePriceMap } from 'state/tokenPrices/priceMap'
import { RefreshTier, expire, register, unregister } from 'state/tokenPrices/registry'

const EMPTY_CHAIN_PRICES: { [address: string]: number | null } = Object.freeze({})

export type TokenPricesOptions = {
  /**
   * Defaults to `'live'`, so a screen shows a current price for as long as it is open. Drop to
   * `'once'` where a consumer is mounted per row of a list: there "the UI is open" no longer means
   * "the user is watching this number", and the whole list would refresh on the TTL while they read.
   */
  refresh?: RefreshTier
}

export const useTokenPricesWithLoading = (
  addresses: Array<string>,
  customChain?: ChainId,
  options?: TokenPricesOptions,
): {
  data: { [address: string]: number }
  loading: boolean
  refetch: () => void
} => {
  const { chainId: currentChain } = useActiveWeb3React()
  const chainId = customChain || currentChain
  const tier: RefreshTier = options?.refresh ?? 'live'

  // Unmemoized on purpose: collapses any array identity — inline literals, per-block rebuilds — into
  // a primitive that every memo below and the subscription effect key on.
  const addressKeys = [...addresses]
    .map(address => address.toLowerCase())
    .sort()
    .join(',')

  const wrappedNativeAddress = useMemo(() => (WETH[chainId] as Token | undefined)?.address?.toLowerCase(), [chainId])

  const tokenList = useMemo(() => {
    const list = addressKeys.split(',').filter(Boolean)

    if (list.includes(NATIVE_TOKEN_PRICE_KEY) && wrappedNativeAddress) {
      list.push(wrappedNativeAddress)
    }

    return Array.from(new Set(list))
  }, [addressKeys, wrappedNativeAddress])

  // Subscribing is what makes the updater fetch these addresses; this hook never requests anything
  // itself, so there is exactly one scheduler and no way for consumers to stampede the endpoint.
  useEffect(() => {
    if (!chainId || !tokenList.length) return
    register(chainId, tokenList, tier)
    return () => unregister(chainId, tokenList, tier)
  }, [chainId, tokenList, tier])

  const chainPrices = useAppSelector(state => state.tokenPrices[chainId] ?? EMPTY_CHAIN_PRICES)

  const data: {
    [address: string]: number
  } = useMemo(
    () => resolvePriceMap(tokenList, chainPrices, wrappedNativeAddress),
    [tokenList, chainPrices, wrappedNativeAddress],
  )

  // `data` is rebuilt whenever this chain's prices change — including for tokens this caller never
  // asked about. Cache it by a value signature over the requested prices so the reference only
  // changes when a requested token's resolved price actually changes.
  const dataSignature = tokenList.map(address => `${address}:${data[address] ?? 0}`).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dataCached = useMemo(() => data, [dataSignature])

  // "At least one of my addresses has never resolved" — not "a request is in flight". It falls false
  // once and stays false through every background refresh, so consumers gating a skeleton or a
  // one-shot initialization on it never flicker or re-run.
  const loading = useMemo(() => tokenList.some(address => chainPrices[address] === undefined), [tokenList, chainPrices])

  // Callers re-fire `refetch` whenever its identity changes, so it must be stable for the hook's
  // lifetime; read the current address list from a ref instead of closing over it.
  const forceTargetRef = useRef({ chainId, tokenList })
  forceTargetRef.current = { chainId, tokenList }
  const refetch = useCallback(() => {
    const { chainId: targetChain, tokenList: targetList } = forceTargetRef.current
    if (targetChain) expire(targetChain, targetList)
  }, [])

  return { data: dataCached, loading, refetch }
}

export const useTokenPrices = (
  addresses: Array<string>,
  chainId?: ChainId,
  options?: TokenPricesOptions,
): {
  [address: string]: number
} => {
  const { data } = useTokenPricesWithLoading(addresses, chainId, options)
  return data
}
