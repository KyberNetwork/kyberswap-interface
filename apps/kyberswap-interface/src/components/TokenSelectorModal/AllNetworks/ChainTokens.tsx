import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { useQuery } from '@tanstack/react-query'
import { memo, useCallback, useMemo, useRef } from 'react'
import { useDeepCompareEffect } from 'react-use'

import { ChainSnapshot } from 'components/TokenSelectorModal/AllNetworks/types'
import { TokenSelectorTab } from 'components/TokenSelectorModal/constants'
import { useInventoryDiscoveries } from 'components/TokenSelectorModal/hooks/useInventoryDiscoveries'
import { useLocalTokenMetrics } from 'components/TokenSelectorModal/hooks/useLocalTokenMetrics'
import { splitFavoriteTokens } from 'components/TokenSelectorModal/hooks/useTokenFavorites'
import { tokenRowKey } from 'components/TokenSelectorModal/types'
import { NativeCurrencies } from 'constants/tokens'
import { useBalanceWait } from 'hooks/useBalanceWait'
import { fetchListTokenByAddresses, useAllTokensWithLoading } from 'hooks/useTokens'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useEvmBalanceAccount } from 'state/wallet/WalletBalanceContext'
import { useNativeBalance, useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { useInventoryTokenBalances, useWalletInventory } from 'state/walletInventory/hooks'
import { getTokenAddress, isTokenNative } from 'utils/tokenInfo'

const EMPTY_TOKENS: Token[] = []
const EMPTY_CURRENCIES: Currency[] = []

type Props = {
  chainId: ChainId
  activeTab: TokenSelectorTab
  session: string
  catalogTokens: Currency[]
  onSnapshot: (session: string, chainId: ChainId, snapshot: ChainSnapshot) => void
}

/** Each chain reuses the single-chain sources. Only acquisition state contributes to the trailing loader. */
const ChainTokensSource = ({ chainId, activeTab, session, catalogTokens, onSnapshot }: Props) => {
  const account = useEvmBalanceAccount()

  const isAll = activeTab === TokenSelectorTab.All
  const isFavorites = activeTab === TokenSelectorTab.Favorites

  const { tokens: defaultTokens, isLoading: listLoading } = useAllTokensWithLoading(false, chainId)
  const imports = useUserAddedTokens(chainId)
  const { favoriteTokens, isLoading: favoritesLoading } = useUserFavoriteTokens(chainId)

  // Local metadata stays derived from Redux; only missing metadata belongs in the query cache.
  const { available, missing } = useMemo(
    () => splitFavoriteTokens(favoriteTokens ?? [], defaultTokens),
    [favoriteTokens, defaultTokens],
  )
  const missingKey = missing.join(',')
  const favorites = useQuery({
    queryKey: ['token-selector-favorites', chainId, missingKey],
    enabled: isFavorites && !favoritesLoading && !!missingKey,
    retry: false,
    staleTime: 60_000,
    queryFn: () => fetchListTokenByAddresses(missingKey.split(','), chainId),
  })

  // Imported/Favorites also need inventory for balances and imported-symbol impersonation checks.
  const inventory = useWalletInventory(chainId)
  const { tokens: discoveries, impersonators } = useInventoryDiscoveries(inventory, defaultTokens, imports, chainId)

  const currencies = useMemo<Currency[]>(() => {
    const source = isAll
      ? [...Object.values(defaultTokens), ...discoveries, ...imports, NativeCurrencies[chainId], ...catalogTokens]
      : isFavorites
      ? [...available, ...(missingKey ? favorites.data ?? [] : [])]
      : imports
    const seen = new Set<string>()

    return source.filter(token => {
      const key = tokenRowKey(token.chainId, getTokenAddress(token))
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [
    isAll,
    defaultTokens,
    discoveries,
    imports,
    chainId,
    catalogTokens,
    isFavorites,
    available,
    missingKey,
    favorites.data,
  ])

  const tokens = useMemo(
    () => currencies.filter(token => !isTokenNative(token)).map(token => token.wrapped),
    [currencies],
  )
  const [rpc, rpcLoading] = useTokenBalancesWithLoadingIndicator(
    account && !inventory.active ? tokens : EMPTY_TOKENS,
    chainId,
  )
  const indexed = useInventoryTokenBalances(tokens, inventory)
  const balances = inventory.active ? indexed : rpc
  const native = useNativeBalance(chainId)
  const waiting = useBalanceWait(balances, !!account)
  const balanceOf = useCallback(
    (token: Currency) => (isTokenNative(token) ? native : balances[token.wrapped.address]),
    [native, balances],
  )

  const priceAddresses = currencies
    .filter(token => balanceOf(token)?.greaterThan('0'))
    .map(token => token.wrapped.address)
  const prices = useTokenPrices(priceAddresses, chainId)
  const extras = useLocalTokenMetrics(isAll ? EMPTY_CURRENCIES : currencies, chainId)

  const initialListDone = useRef(false)
  const initialPending =
    listLoading || (isAll && inventory.loading) || (!!account && !inventory.active && rpcLoading && waiting)
  if (!initialPending) initialListDone.current = true

  const snapshot = useMemo<ChainSnapshot>(() => {
    const unlisted = new Set(discoveries.map(token => token.address))
    const favoriteSet = new Set(favoriteTokens)
    const importsSet = new Set(imports.map(token => token.address))

    return {
      currencies: isAll
        ? currencies.filter(token => balanceOf(token)?.greaterThan('0') || importsSet.has(getTokenAddress(token)))
        : currencies,
      balances: Object.fromEntries(
        currencies.map(token => [
          tokenRowKey(chainId, getTokenAddress(token)),
          {
            balance: balanceOf(token),
            price: prices[token.wrapped.address.toLowerCase()] ?? 0,
            waiting,
            favorite: favoriteSet.has(getTokenAddress(token).toLowerCase()),
            unlisted: unlisted.has(getTokenAddress(token)),
            impersonator: impersonators.has(getTokenAddress(token)),
          },
        ]),
      ),
      extras,
      loading: isFavorites
        ? favoritesLoading || (!!missingKey && favorites.isLoading)
        : isAll && !initialListDone.current && initialPending,
    }
  }, [
    currencies,
    chainId,
    impersonators,
    balanceOf,
    prices,
    waiting,
    discoveries,
    favoriteTokens,
    imports,
    extras,
    isAll,
    isFavorites,
    favoritesLoading,
    missingKey,
    favorites.isLoading,
    initialPending,
  ])

  // Compare the full observation, including token metadata, before publishing to the controller.
  useDeepCompareEffect(() => {
    onSnapshot(session, chainId, snapshot)
  }, [session, chainId, snapshot, onSnapshot])

  return null
}

export const ChainTokens = memo(ChainTokensSource)
