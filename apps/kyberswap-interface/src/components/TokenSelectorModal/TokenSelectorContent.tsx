import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useInfiniteQuery } from '@tanstack/react-query'
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

import { ButtonEmpty } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import { Center, HStack, Stack } from 'components/Stack'
import { OtherChainTokens } from 'components/TokenSelectorModal/OtherChainTokens'
import { PinnedTokens } from 'components/TokenSelectorModal/PinnedTokens'
import TokenList from 'components/TokenSelectorModal/TokenList'
import {
  ContentWrapper,
  PaddedColumn,
  SearchIcon,
  SearchInput,
  SearchWrapper,
  Separator,
} from 'components/TokenSelectorModal/components'
import {
  TOKEN_SEARCH_PAGE_SIZE,
  fetchTokens,
  useAddressRpcTokenSearch,
  useTokenComparator,
} from 'components/TokenSelectorModal/utils'
import { NETWORKS_INFO } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, useAllTokens } from 'hooks/Tokens'
import useChainsConfig from 'hooks/useChainsConfig'
import useDebounce from 'hooks/useDebounce'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
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

interface TokenSelectorContentProps {
  isOpen: boolean
  onDismiss?: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect?: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showPinnedTokens?: boolean
  onImportToken?: (token: Token) => void
  customChainId?: ChainId
  filterWrap?: boolean
  title?: string
  tooltip?: ReactNode
  onShowTokenInfo?: (token: Token) => void
  trackingSource?: string
}

const NoResult = () => {
  return (
    <Stack className="h-full p-5" data-testid="no-token-result">
      <p className="mb-5 text-center font-medium text-text3">
        <Trans>No results found.</Trans>
      </p>
    </Stack>
  )
}

const SearchLoading = () => (
  <Stack className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="text-center font-medium text-text3">
      <Trans>Loading...</Trans>
    </p>
  </Stack>
)

export const TokenSelectorContent = ({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showPinnedTokens,
  onDismiss,
  isOpen,
  onImportToken,
  customChainId,
  filterWrap = false,
  title,
  tooltip,
  onShowTokenInfo,
  trackingSource,
}: TokenSelectorContentProps) => {
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const { supportedChains } = useChainsConfig()
  const { trackingHandler } = useTracking()
  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(chainId)
  const removeToken = useRemoveUserAddedToken()

  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [pinnedTokens, setPinnedTokens] = useState<(Token | Currency)[]>([])
  const [loadingPinnedTokens, setLoadingPinnedTokens] = useState(true)

  const inputRef = useRef<HTMLInputElement>(null)
  const listTokenRef = useRef<HTMLDivElement>(null)

  const isImportedTab = activeTab === Tab.Imported
  const debouncedQuery = useDebounce(searchQuery, 200)
  const trackingDebouncedQuery = useDebounce(searchQuery, 1000)
  const isQueryValidEVMAddress = !!isAddress(chainId, debouncedQuery)

  const defaultTokens = useAllTokens(false, chainId)
  const tokenImports = useUserAddedTokens(chainId)
  const tokenComparator = useTokenComparator(false, customChainId)

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
      debouncedQuery && !isQueryValidEVMAddress && lastPage.length === TOKEN_SEARCH_PAGE_SIZE
        ? allPages.length + 1
        : undefined,
    retry: false,
  })

  const tokenSearchResults = useMemo(() => tokenSearchData?.pages.flatMap(page => page) ?? [], [tokenSearchData?.pages])

  const tokenImportsFiltered = useMemo(() => {
    return [...(debouncedQuery ? filterTokens(chainId, tokenImports, debouncedQuery) : tokenImports)].sort(
      tokenComparator,
    )
  }, [debouncedQuery, chainId, tokenImports, tokenComparator])

  const filteredPinnedTokens = useMemo(() => {
    return pinnedTokens.filter(filterWrapFunc)
  }, [pinnedTokens, filterWrapFunc])

  const { currentChainRpcToken, otherChainTokens, isCheckingOtherChains } = useAddressRpcTokenSearch({
    chainId,
    debouncedQuery,
    supportedChains,
    isImportedTab,
    isQueryValidEVMAddress,
    isFetchedTokenSearch,
    isFetchingTokenSearch,
    hasTokenSearchResults: !!tokenSearchResults.length,
  })

  const fetchedTokens = useMemo(
    () =>
      debouncedQuery ? tokenSearchResults.concat(filterTruthy([currentChainRpcToken])) : Object.values(defaultTokens),
    [currentChainRpcToken, debouncedQuery, defaultTokens, tokenSearchResults],
  )

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (!debouncedQuery) {
      return [...fetchedTokens].sort(tokenComparator).filter(filterWrapFunc)
    }
    return fetchedTokens.filter(filterWrapFunc)
  }, [fetchedTokens, debouncedQuery, tokenComparator, filterWrapFunc])

  const isLoadingTokens = isLoadingTokenSearch
  const visibleCurrencies: Currency[] = useMemo(() => {
    return isImportedTab || (!isImportedTab && !filteredSortedTokens.length)
      ? tokenImportsFiltered
      : filteredSortedTokens
  }, [isImportedTab, filteredSortedTokens, tokenImportsFiltered])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect?.(isTokenNative(currency) ? NativeCurrencies[currency.chainId] : currency)
      onDismiss?.()
    },
    [onDismiss, onCurrencySelect],
  )

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
    (event: MouseEvent, currency: Currency) => {
      event.stopPropagation()
      const address = currency.wrapped.address
      if (!address) return

      toggleFavoriteToken({
        chainId,
        address,
      })
    },
    [chainId, toggleFavoriteToken],
  )

  const fetchListTokens = useCallback(async () => {
    if (!hasNextPage || isFetchingTokenSearch) return
    await fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingTokenSearch])

  const fetchPinnedTokens = useCallback(async () => {
    try {
      if (!Object.keys(defaultTokens).length) return
      setLoadingPinnedTokens(true)
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
      setPinnedTokens(result)
    } catch (error) {
      console.log('err', error)
    }
    setLoadingPinnedTokens(false)
  }, [chainId, favoriteTokens, defaultTokens])

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

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      if (!isMobile) inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    fetchPinnedTokens()
  }, [fetchPinnedTokens])

  useEffect(() => {
    if (!trackingDebouncedQuery || !trackingSource) return
    trackingHandler(TRACKING_EVENT_TYPE.TOKEN_SEARCHED, {
      source: trackingSource,
      search_query: trackingDebouncedQuery,
      chain: NETWORKS_INFO[chainId].name,
      is_address: !!isAddress(chainId, trackingDebouncedQuery),
    })
  }, [trackingDebouncedQuery, trackingSource, chainId, trackingHandler])

  return (
    <ContentWrapper>
      <PaddedColumn className="gap-[14px]">
        <HStack className="items-center justify-between">
          <HStack as="span" className="text-xl font-medium">
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
          </HStack>
          <CloseIcon onClick={onDismiss} data-testid="close-icon" />
        </HStack>
        <span className="text-xs font-medium text-subText">
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

        {showPinnedTokens && (
          <PinnedTokens
            tokens={filteredPinnedTokens}
            onToggleFavorite={handleClickFavorite}
            onSelect={handleCurrencySelect}
            selectedCurrency={selectedCurrency}
          />
        )}
        {loadingPinnedTokens && (
          <Center>
            <span className="text-xs text-subText">Loading ...</span>
          </Center>
        )}
        <HStack className="justify-between">
          <HStack className="gap-x-6">
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
          </HStack>
        </HStack>
      </PaddedColumn>

      <Separator />

      {isImportedTab && visibleCurrencies.length > 0 && (
        <HStack className="items-center justify-between px-5 pb-1 pt-3">
          <div className="text-sm font-medium text-subText">
            <Trans>{visibleCurrencies.length} Custom Tokens</Trans>
          </div>
          <ButtonEmpty
            type="button"
            className="w-fit gap-[5px] rounded-3xl bg-subText-20 px-2.5 py-[5px] text-xs text-subText"
            onClick={removeAllImportToken}
            data-testid="button-clear-all-import-token"
          >
            <Trash size={13} />
            <Trans>Clear All</Trans>
          </ButtonEmpty>
        </HStack>
      )}

      {visibleCurrencies?.length > 0 ? (
        <TokenList
          listTokenRef={listTokenRef}
          onRemoveImportedToken={isImportedTab ? removeImportedToken : undefined}
          currencies={visibleCurrencies}
          onToggleFavorite={handleClickFavorite}
          onCurrencySelect={handleCurrencySelect}
          otherCurrency={otherSelectedCurrency}
          selectedCurrency={selectedCurrency}
          onImportToken={onImportToken}
          loadMoreRows={fetchListTokens}
          hasMore={!!hasNextPage}
          customChainId={customChainId}
          onShowTokenInfo={onShowTokenInfo}
        />
      ) : (
        <Stack className="min-h-0 flex-1">
          {isLoadingTokens ? (
            <SearchLoading />
          ) : isCheckingOtherChains || otherChainTokens.length ? (
            <OtherChainTokens
              tokens={otherChainTokens}
              loading={isCheckingOtherChains}
              loadingFallback={<SearchLoading />}
            />
          ) : (
            <NoResult />
          )}
        </Stack>
      )}
    </ContentWrapper>
  )
}
