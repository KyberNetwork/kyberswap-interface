import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useInfiniteQuery, useQueries } from '@tanstack/react-query'
import axios from 'axios'
import {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { isMobile } from 'react-device-detect'
import { Trash } from 'react-feather'
import ksSettingApi from 'services/ksSetting'

import Column from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { RowBetween } from 'components/Row'
import CommonBases from 'components/SearchModal/CommonBases'
import CurrencyList from 'components/SearchModal/CurrencyList'
import { useTokenComparator } from 'components/SearchModal/sorting'
import { PaddedColumn, SearchIcon, SearchInput, SearchWrapper, Separator } from 'components/SearchModal/styleds'
import { KS_SETTING_API } from 'constants/env'
import { NETWORKS_INFO } from 'constants/networks'
import type { NetworkInfo } from 'constants/networks/type'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, fetchTokenInfoFromRpc, formatAndCacheToken, useAllTokens } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import store from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { ButtonText, CloseIcon } from 'theme'
import { filterTruthy, isAddress } from 'utils'
import { cn } from 'utils/cn'
import { filterTokens } from 'utils/filtering'
import { isTokenNative } from 'utils/tokenInfo'

enum Tab {
  All,
  Imported,
}

export const ContentWrapper = ({ className, ...rest }: React.ComponentProps<typeof Column>) => (
  <Column className={cn('relative w-full flex-1 pb-2.5 max-sm:pb-0', className)} {...rest} />
)

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  setImportToken: (token: Token) => void
  customChainId?: ChainId
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  setTokenToShowInfo: (token: Token) => void
  trackingSource?: string
}

const PAGE_SIZE = 20

const fetchTokens = async (search: string | undefined, page: number, chainId: ChainId): Promise<WrappedTokenInfo[]> => {
  try {
    if (search && chainId && isAddress(chainId, search)) {
      const { data: token } = await store.dispatch(
        ksSettingApi.endpoints.getTokenByAddress.initiate({ address: search, chainId }),
      )
      return token ? [token as WrappedTokenInfo] : []
    }
    const params: { query: string; isWhitelisted?: boolean; pageSize: number; page: number; chainIds: string } = {
      query: search ?? '',
      chainIds: chainId.toString(),
      page,
      pageSize: PAGE_SIZE,
    }
    if (!search) {
      params.isWhitelisted = true
    }
    const stringParams = Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)]))
    const p = new URLSearchParams(stringParams)
    const url = `${KS_SETTING_API}/v1/tokens?${p.toString()}`

    const response = await axios.get(url)
    const { tokens = [] } = response.data.data
    return filterTruthy(tokens.map(formatAndCacheToken))
  } catch (error) {
    return []
  }
}

export const NoResult = ({ msg }: { msg?: ReactNode }) => {
  return (
    <Column className="h-full p-5" data-testid="no-token-result">
      <p className="m-0 mb-5 text-center font-medium text-text3">{msg || <Trans>No results found.</Trans>}</p>
    </Column>
  )
}

const SearchLoading = ({ msg }: { msg?: ReactNode }) => (
  <Column className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="m-0 text-center font-medium text-text3">{msg || <Trans>Loading...</Trans>}</p>
  </Column>
)

const OtherChainTokenResult = ({ tokens, loading }: { tokens: WrappedTokenInfo[]; loading: boolean }) => {
  const { changeNetwork } = useChangeNetwork()

  if (loading && !tokens.length) {
    return <SearchLoading />
  }

  if (!tokens.length) return null

  return (
    <Column className="h-full gap-2 p-5">
      <p className="m-0 mb-3 shrink-0 text-center font-medium text-text3">
        <Trans>Found on other chains</Trans>
      </p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {tokens.map(token => {
          const networkInfo = NETWORKS_INFO[token.chainId] as NetworkInfo

          return (
            <button
              type="button"
              key={`${token.chainId}-${token.address}`}
              onClick={() => changeNetwork(token.chainId)}
              className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg bg-buttonBlack px-4 py-2 hover:bg-primary-15"
            >
              <div className="flex min-w-0 items-center gap-2">
                <CurrencyLogo currency={token} size="24px" />
                <div className="flex min-w-0 flex-col items-start gap-0.5">
                  <span className="truncate text-sm font-medium text-text">{token.symbol}</span>
                  <span className="truncate text-xs text-subText">{token.name}</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="hidden text-xs font-medium text-primary group-hover:inline">
                  <Trans>Switch to</Trans>
                </span>
                <img src={networkInfo.icon} alt={networkInfo.name} className="size-4 rounded-full" />
                <span className="text-xs font-medium text-subText">{networkInfo.name}</span>
              </div>
            </button>
          )
        })}
      </div>
    </Column>
  )
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen,
  setImportToken,
  customChainId,
  filterWrap = false,
  title,
  tooltip,
  setTokenToShowInfo,
  trackingSource,
}: CurrencySearchProps) {
  // Network and modal state
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const { supportedChains } = useChainsConfig()
  const { trackingHandler } = useTracking()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)
  const isImportedTab = activeTab === Tab.Imported

  // Search input state
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trackingDebouncedQuery = useDebounce(searchQuery, 1000)
  const isQueryValidEVMAddress = !!isAddress(chainId, debouncedQuery)

  // Token sources
  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(chainId)
  const defaultTokens = useAllTokens(false, chainId)
  const tokenImports = useUserAddedTokens(chainId)
  const tokenComparator = useTokenComparator(false, customChainId)

  const [commonTokens, setCommonTokens] = useState<(Token | Currency)[]>([])
  const [loadingCommon, setLoadingCommon] = useState(true)

  const tokenImportsFiltered = useMemo(() => {
    return (debouncedQuery ? filterTokens(chainId, tokenImports, debouncedQuery) : tokenImports).sort(tokenComparator)
  }, [debouncedQuery, chainId, tokenImports, tokenComparator])

  // input eth => output filter weth, input weth => output filter eth
  const filterWrapFunc = useCallback(
    (token: Currency | undefined) => {
      if (filterWrap && otherSelectedCurrency?.equals(WETH[chainId])) {
        return !isTokenNative(token)
      }
      if (filterWrap && otherSelectedCurrency && isTokenNative(otherSelectedCurrency)) {
        return !token?.equals(WETH[chainId])
      }
      return true
    },
    [chainId, otherSelectedCurrency, filterWrap],
  )

  const filteredCommonTokens = useMemo(() => {
    return filterTokens(chainId, commonTokens as Token[], debouncedQuery).filter(filterWrapFunc)
  }, [commonTokens, debouncedQuery, chainId, filterWrapFunc])

  // Search APIs: KS Setting first, then RPC for address-only fallback.
  const {
    data: tokenSearchData,
    fetchNextPage,
    hasNextPage,
    isFetched: isFetchedTokenSearch,
    isFetching: isFetchingTokenSearch,
    isLoading: isLoadingTokenSearch,
  } = useInfiniteQuery({
    queryKey: ['currency-search-tokens', chainId, debouncedQuery],
    initialPageParam: 1,
    enabled: !!debouncedQuery && !isImportedTab,
    queryFn: ({ pageParam }) => fetchTokens(debouncedQuery, pageParam, chainId),
    getNextPageParam: (lastPage, allPages) =>
      debouncedQuery && !isQueryValidEVMAddress && lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    retry: false,
  })

  const tokenSearchResults = useMemo(() => tokenSearchData?.pages.flatMap(page => page) ?? [], [tokenSearchData?.pages])

  const rpcSearchChainIds = useMemo(
    () => [
      chainId,
      ...supportedChains
        .map(networkInfo => networkInfo.chainId)
        .filter(supportedChainId => supportedChainId !== chainId && NETWORKS_INFO[supportedChainId]?.multicall),
    ],
    [chainId, supportedChains],
  )

  const shouldFetchRpcTokens =
    !!debouncedQuery &&
    !isImportedTab &&
    isQueryValidEVMAddress &&
    isFetchedTokenSearch &&
    !isFetchingTokenSearch &&
    !tokenSearchResults.length

  const rpcTokenQueries = useQueries({
    queries: rpcSearchChainIds.map(rpcChainId => ({
      queryKey: ['currency-search-rpc-token', rpcChainId, debouncedQuery],
      enabled: shouldFetchRpcTokens,
      queryFn: async () => {
        const rawToken = await fetchTokenInfoFromRpc(debouncedQuery, rpcChainId, {
          silent: rpcChainId !== chainId,
        })
        return rawToken
          ? new WrappedTokenInfo({
              chainId: rawToken.chainId,
              address: rawToken.address,
              name: rawToken.name || 'Unknown Token',
              decimals: rawToken.decimals,
              symbol: rawToken.symbol || 'UNKNOWN',
            })
          : undefined
      },
      retry: false,
    })),
  })

  const rpcTokens = useMemo(
    () => (shouldFetchRpcTokens ? filterTruthy(rpcTokenQueries.map(query => query.data)) : []),
    [rpcTokenQueries, shouldFetchRpcTokens],
  )
  const currentChainRpcToken = rpcTokens.find(token => token.chainId === chainId)
  const otherChainTokens = rpcTokens.filter(token => token.chainId !== chainId)
  const isFetchingRpcTokens = shouldFetchRpcTokens && rpcTokenQueries.some(query => query.isFetching)
  const isLoadingRpcTokens = shouldFetchRpcTokens && rpcTokenQueries.some(query => query.isLoading)

  const fetchedTokens = useMemo(
    () =>
      debouncedQuery ? tokenSearchResults.concat(filterTruthy([currentChainRpcToken])) : Object.values(defaultTokens),
    [currentChainRpcToken, debouncedQuery, defaultTokens, tokenSearchResults],
  )

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (!debouncedQuery) {
      // whitelist token
      return fetchedTokens.sort(tokenComparator).filter(filterWrapFunc)
    }
    return fetchedTokens.filter(filterWrapFunc)
  }, [fetchedTokens, debouncedQuery, tokenComparator, filterWrapFunc])

  const isLoadingTokens = isLoadingTokenSearch
  const isCheckingOtherChains = isLoadingRpcTokens || isFetchingRpcTokens

  // Selection and search input handlers
  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>(null)

  // clear the input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      if (!isMobile) inputRef.current?.focus()
    }
  }, [isOpen])

  const listTokenRef = useRef<HTMLDivElement>(null)

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.target.value
      const checksumInput = isAddress(chainId, input)
      setSearchQuery(checksumInput || input)
      if (listTokenRef?.current) listTokenRef.current.scrollTop = 0
    },
    [chainId],
  )

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return
      const s = searchQuery.toLowerCase().trim()
      const native = NativeCurrencies[chainId]
      if (s === native.symbol?.toLowerCase() || s === native.name?.toLowerCase()) {
        handleCurrencySelect(NativeCurrencies[chainId])
        return
      }
      const totalToken = filteredSortedTokens.length
      if (totalToken && (filteredSortedTokens[0].symbol?.toLowerCase() === s || totalToken === 1)) {
        handleCurrencySelect(filteredSortedTokens[0])
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery, chainId],
  )

  const handleClickFavorite = useCallback(
    (e: MouseEvent, currency: Currency) => {
      e.stopPropagation()
      const address = currency.wrapped.address
      if (!address) return

      toggleFavoriteToken({
        chainId,
        address,
      })
    },
    [chainId, toggleFavoriteToken],
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // Favorite/common token hydration
  const fetchFavoriteTokenFromAddress = useCallback(async () => {
    try {
      if (!Object.keys(defaultTokens).length) return
      setLoadingCommon(true)
      let result: (Token | Currency)[] = []
      const addressesToFetch: string[] = []

      favoriteTokens?.forEach(address => {
        let token
        Object.entries(defaultTokens).forEach(([add, t]) => {
          if (add.toLowerCase() === address.toLowerCase()) {
            token = t
          }
        })
        if (token) {
          result.push(token)
          return
        }
        addressesToFetch.push(address)
      })

      if (addressesToFetch.length) {
        const tokens = await fetchListTokenByAddresses(addressesToFetch, chainId)
        // Sort the returned token list to match the order of the passed address list
        result = result.concat(
          tokens.sort((x, y) => {
            return addressesToFetch.indexOf(x.wrapped.address) - addressesToFetch.indexOf(y.wrapped.address)
          }),
        )
      }
      setCommonTokens(result)
    } catch (error) {
      console.log('err', error)
    }
    setLoadingCommon(false)
  }, [chainId, favoriteTokens, defaultTokens])

  useEffect(() => {
    fetchFavoriteTokenFromAddress()
  }, [fetchFavoriteTokenFromAddress])

  const fetchListTokens = useCallback(async () => {
    if (!hasNextPage || isFetchingTokenSearch) return
    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingTokenSearch])

  // Search tracking
  useEffect(() => {
    if (!trackingDebouncedQuery || !trackingSource) return
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SEARCHED, {
      source: trackingSource,
      search_query: trackingDebouncedQuery,
      chain: NETWORKS_INFO[chainId].name,
      is_address: !!isAddress(chainId, trackingDebouncedQuery),
    })
  }, [trackingDebouncedQuery, trackingSource, chainId, trackingHandler])

  const visibleCurrencies: Currency[] = useMemo(() => {
    return isImportedTab || (!isImportedTab && !filteredSortedTokens.length)
      ? tokenImportsFiltered
      : filteredSortedTokens
  }, [isImportedTab, filteredSortedTokens, tokenImportsFiltered])

  const removeToken = useRemoveUserAddedToken()

  const removeImportedToken = useCallback(
    (token: Token) => {
      removeToken(chainId, token.address)
      if (favoriteTokens?.some(el => el.toLowerCase() === token.address.toLowerCase()))
        toggleFavoriteToken({
          chainId,
          address: token.address,
        })
    },
    [chainId, toggleFavoriteToken, removeToken, favoriteTokens],
  )

  const removeAllImportToken = () => {
    tokenImports?.forEach(removeImportedToken)
  }

  const onChangeTab = (tab: Tab) => {
    setActiveTab(tab)
  }

  return (
    <ContentWrapper>
      <PaddedColumn className="gap-[14px]">
        <RowBetween>
          <span className="flex text-xl font-medium">
            {title || <Trans>Select a token</Trans>}
            <InfoHelper
              zIndexTooltip={Z_INDEXS.MODAL}
              size={16}
              fontSize={14}
              text={
                tooltip || (
                  <span>
                    <Trans>
                      Find a token by searching for its name or symbol or by pasting its address below.
                      <br />
                      You can select and trade any token on KyberSwap.
                    </Trans>
                  </span>
                )
              }
            />
          </span>
          <CloseIcon onClick={onDismiss} data-testid="close-icon" />
        </RowBetween>
        <span className="text-xs text-subText">
          <Trans>
            You can search and select <span className="text-text">any token</span> on KyberSwap.
          </Trans>
        </span>

        <SearchWrapper>
          <SearchInput
            type="text"
            id="token-search-input"
            data-testid="token-search-input"
            placeholder={t`Search by token name, token symbol or address`}
            value={searchQuery}
            ref={inputRef}
            onChange={handleInput}
            onKeyDown={handleEnter}
            autoComplete="off"
          />
          <SearchIcon size={18} className="text-border" />
        </SearchWrapper>

        {showCommonBases && (
          <CommonBases
            tokens={filteredCommonTokens}
            handleToggleFavorite={handleClickFavorite}
            onSelect={handleCurrencySelect}
            selectedCurrency={selectedCurrency}
          />
        )}
        {loadingCommon && (
          <div className="flex justify-center">
            <span className="text-xs text-subText">Loading ...</span>
          </div>
        )}
        <RowBetween>
          <div className="flex gap-x-6">
            <ButtonText
              data-active={activeTab === Tab.All}
              onClick={() => onChangeTab(Tab.All)}
              data-testid="tab-all"
              className={cn('h-8 focus:no-underline', activeTab === Tab.All ? 'text-primary' : 'text-subText')}
            >
              <span className="text-sm font-medium">
                <Trans>All</Trans>
              </span>
            </ButtonText>

            <ButtonText
              data-active={isImportedTab}
              onClick={() => onChangeTab(Tab.Imported)}
              data-testid="tab-import"
              className={cn('h-8 focus:no-underline', isImportedTab ? 'text-primary' : 'text-subText')}
            >
              <span className="text-sm font-medium">
                <Trans>Imported</Trans>
              </span>
            </ButtonText>
          </div>
        </RowBetween>
      </PaddedColumn>

      <Separator />

      {isImportedTab && visibleCurrencies.length > 0 && (
        <div className="flex items-center justify-between px-5 pb-2.5 pt-[15px] text-xs text-subText">
          <div>
            <Trans>{visibleCurrencies.length} Custom Tokens</Trans>
          </div>
          <div
            className="flex cursor-pointer items-center gap-[5px] rounded-3xl bg-subText-20 px-2.5 py-[5px]"
            onClick={removeAllImportToken}
            data-testid="button-clear-all-import-token"
          >
            <Trash size={13} />
            <Trans>Clear All</Trans>
          </div>
        </div>
      )}

      {visibleCurrencies?.length > 0 ? (
        <CurrencyList
          listTokenRef={listTokenRef}
          removeImportedToken={removeImportedToken}
          currencies={visibleCurrencies}
          showImported={isImportedTab}
          handleClickFavorite={handleClickFavorite}
          onCurrencySelect={handleCurrencySelect}
          otherCurrency={otherSelectedCurrency}
          selectedCurrency={selectedCurrency}
          setImportToken={setImportToken}
          loadMoreRows={fetchListTokens}
          hasMore={!!hasNextPage}
          customChainId={customChainId}
          setTokenToShowInfo={setTokenToShowInfo}
        />
      ) : (
        <div className="min-h-0 flex-1">
          {isLoadingTokens ? (
            <SearchLoading />
          ) : isCheckingOtherChains ? (
            <OtherChainTokenResult tokens={otherChainTokens} loading={isCheckingOtherChains} />
          ) : otherChainTokens.length ? (
            <OtherChainTokenResult tokens={otherChainTokens} loading={isCheckingOtherChains} />
          ) : (
            <NoResult />
          )}
        </div>
      )}
    </ContentWrapper>
  )
}
