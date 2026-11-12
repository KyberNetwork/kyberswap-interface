import { ChainId } from '@kyberswap/ks-sdk-core'
import { useQueries } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { shallowEqual } from 'react-redux'
import ksSettingApi from 'services/ksSetting'

import { ETHER_ADDRESS, ZERO_ADDRESS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { useNearIntentsTokens } from 'hooks/useNearIntentsTokens'
import { fetchSolanaTokens } from 'hooks/useSolanaTokens'
import { fetchTokenInfoFromRpc } from 'hooks/useTokens'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { BitcoinToken, type Chain, type Currency, NonEvmChain } from 'types/crossChain'
import { isAddress } from 'utils/address'

const tokenKey = (chain: Chain, id: string) =>
  JSON.stringify([chain, typeof chain === 'number' ? id.toLowerCase() : id])
const nativeToken = (chain: Chain, id: string) => {
  if (typeof chain !== 'number') return undefined
  const native = NativeCurrencies[chain]
  return [ZERO_ADDRESS, ETHER_ADDRESS.toLowerCase(), 'eth', native?.symbol?.toLowerCase()].includes(id.toLowerCase())
    ? native
    : undefined
}

export type HistoryTokenInput = { chain: Chain; token: Currency | string }

// One metadata owner for rows and search. Queries share the existing app caches;
// local Currency snapshots pass through unchanged.
export const useHistoryTokens = (inputs: HistoryTokenInput[]) => {
  const dispatch = useAppDispatch()
  const identities = new Map<string, { chain: Chain; id: string }>()
  for (const { chain, token } of inputs) {
    if (typeof token === 'string' && token) identities.set(tokenKey(chain, token), { chain, id: token })
  }
  const signature = JSON.stringify(
    [...identities.values()].sort((a, b) => tokenKey(a.chain, a.id).localeCompare(tokenKey(b.chain, b.id))),
  )
  const tokens = useMemo(() => JSON.parse(signature) as { chain: Chain; id: string }[], [signature])
  const evmArgs = useMemo(
    () =>
      tokens.flatMap(({ chain, id }) => {
        if (typeof chain !== 'number' || chain === ChainId.ABSTRACT || nativeToken(chain, id)) return []
        const address = isAddress(chain, id)
        return address ? [{ chainId: chain, address }] : []
      }),
    [tokens],
  )
  const selectors = useMemo(() => evmArgs.map(args => ksSettingApi.endpoints.getTokenByAddress.select(args)), [evmArgs])
  const evm = useAppSelector(state => selectors.map(select => select(state)), shallowEqual)
  useEffect(() => {
    const subscriptions = evmArgs.map(args => dispatch(ksSettingApi.endpoints.getTokenByAddress.initiate(args)))
    return () => subscriptions.forEach(subscription => subscription.unsubscribe())
  }, [dispatch, evmArgs])

  const solanaIds = tokens.filter(token => token.chain === NonEvmChain.Solana).map(token => token.id)
  const solana = useQueries({
    queries: solanaIds.map(id => ({
      queryKey: ['cross-chain-solana-tokens', id],
      queryFn: () => fetchSolanaTokens(id),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  })
  const abstractIds = tokens
    .filter(token => token.chain === ChainId.ABSTRACT && !nativeToken(token.chain, token.id))
    .map(token => token.id)
  const abstract = useQueries({
    queries: abstractIds.map(id => ({
      queryKey: ['cross-chain-token', ChainId.ABSTRACT, id.toLowerCase()],
      queryFn: async () => (await fetchTokenInfoFromRpc(id, ChainId.ABSTRACT)) ?? null,
      staleTime: Infinity,
    })),
  })
  const needsNear = tokens.some(token => token.chain === NonEvmChain.Near)
  const { nearTokens, isLoadingNearTokens } = useNearIntentsTokens(!needsNear)
  const metadata = new Map<string, Currency>()
  evmArgs.forEach((args, index) => {
    const token = evm[index].data
    if (token) metadata.set(tokenKey(args.chainId, args.address), token)
  })
  solanaIds.forEach((id, index) => {
    const token = solana[index].data?.find(token => token.id === id)
    if (token) metadata.set(tokenKey(NonEvmChain.Solana, id), token)
  })
  abstractIds.forEach((id, index) => {
    const token = abstract[index].data
    if (token) metadata.set(tokenKey(ChainId.ABSTRACT, id), token)
  })
  const resolve = (token: Currency | string, chain: Chain): Currency | string => {
    if (typeof token !== 'string' || !token) return token
    if (chain === NonEvmChain.Bitcoin) return BitcoinToken
    if (chain === NonEvmChain.Near)
      return (
        nearTokens.find(
          item => item.blockchain === 'near' && (item.assetId === token || item.contractAddress === token),
        ) || token
      )
    return nativeToken(chain, token) || metadata.get(tokenKey(chain, token)) || token
  }
  const loading =
    evm.some(result => result.isUninitialized || result.isLoading) ||
    solana.some(result => result.isLoading) ||
    abstract.some(result => result.isLoading) ||
    (needsNear && isLoadingNearTokens)
  return {
    loading,
    unresolved: !loading && tokens.some(({ chain, id }) => typeof resolve(id, chain) === 'string'),
    resolve,
  }
}
