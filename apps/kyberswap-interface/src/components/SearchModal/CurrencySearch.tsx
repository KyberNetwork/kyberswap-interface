import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import axios from 'axios'
import { ChangeEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Trash } from 'react-feather'
import { usePrevious } from 'react-use'
import ksSettingApi from 'services/ksSetting'

import Column from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RowBetween } from 'components/Row'
import { KS_SETTING_API } from 'constants/env'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { fetchListTokenByAddresses, formatAndCacheToken, useAllTokens, useFetchERC20TokenFromRPC } from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import store from 'state'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { ButtonText, CloseIcon } from 'theme'
import { filterTruthy, isAddress } from 'utils'
import { cn } from 'utils/cn'
import { filterTokens } from 'utils/filtering'
import { isTokenNative } from 'utils/tokenInfo'

import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchIcon, SearchInput, SearchWrapper, Separator } from './styleds'

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
}

const PAGE_SIZE = 20

const fetchTokens = async (
  search: string | undefined,
  page: number,
  chainId: ChainId,
  signal: AbortSignal,
): Promise<WrappedTokenInfo[]> => {
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

    const response = await axios.get(url, { signal })
    const { tokens = [] } = response.data.data
    return filterTruthy(tokens.map(formatAndCacheToken))
  } catch (error) {
    return []
  }
}

export const NoResult = ({ msg }: { msg?: ReactNode }) => {
  return (
    <Column style={{ padding: '20px', height: '100%' }} data-testid="no-token-result">
      <p className="m-0 mb-5 text-center font-medium text-text3">{msg || <Trans>No results found.</Trans>}</p>
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
}: CurrencySearchProps) {
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isQueryValidEVMAddress = !!isAddress(chainId, debouncedQuery)

  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(chainId)

  const defaultTokens = useAllTokens(false, chainId)

  const tokenImports = useUserAddedTokens(chainId)
  const [pageCount, setPageCount] = useState(0)
  const [fetchedTokens, setFetchedTokens] = useState<Token[]>(Object.values(defaultTokens))

  const tokenComparator = useTokenComparator(false, customChainId)

  const [commonTokens, setCommonTokens] = useState<(Token | Currency)[]>([])
  const [loadingCommon, setLoadingCommon] = useState(true)

  const tokenImportsFiltered = useMemo(() => {
    return (debouncedQuery ? filterTokens(chainId, tokenImports, debouncedQuery) : tokenImports).sort(tokenComparator)
  }, [debouncedQuery, chainId, tokenImports, tokenComparator])

  const fetchERC20TokenFromRPC = useFetchERC20TokenFromRPC(chainId)

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

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (!debouncedQuery) {
      // whitelist token
      return fetchedTokens.sort(tokenComparator).filter(filterWrapFunc)
    }
    return fetchedTokens.filter(filterWrapFunc)
  }, [fetchedTokens, debouncedQuery, tokenComparator, filterWrapFunc])

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
    (e: React.MouseEvent, currency: any) => {
      e.stopPropagation()
      const address = currency?.wrapped?.address || currency.address
      if (!address) return

      toggleFavoriteToken({
        chainId,
        address,
      })
    },
    [chainId, toggleFavoriteToken],
  )

  // menu ui
  const isImportedTab = activeTab === Tab.Imported
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

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

  const abortControllerRef = useRef(new AbortController())
  const fetchListTokens = useCallback(
    async (page?: number) => {
      const nextPage = (page ?? pageCount) + 1
      let tokens: WrappedTokenInfo[] = []
      if (debouncedQuery && !isImportedTab) {
        abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()
        tokens = await fetchTokens(debouncedQuery, nextPage, chainId, abortControllerRef.current.signal)

        if (tokens.length === 0 && isQueryValidEVMAddress) {
          const rawToken = await fetchERC20TokenFromRPC(debouncedQuery)

          if (rawToken) {
            tokens.push(
              new WrappedTokenInfo({
                chainId: rawToken.chainId,
                address: rawToken.address,
                name: rawToken.name || 'Unknown Token',
                decimals: rawToken.decimals,
                symbol: rawToken.symbol || 'UNKNOWN',
              }),
            )
          }
        }
      } else {
        tokens = isImportedTab ? [] : Object.values(defaultTokens)
      }

      setPageCount(nextPage)
      setFetchedTokens(current => (nextPage === 1 ? [] : current).concat(tokens))
      setHasMoreToken(tokens.length === PAGE_SIZE && !!debouncedQuery)
    },
    [isImportedTab, chainId, debouncedQuery, defaultTokens, fetchERC20TokenFromRPC, isQueryValidEVMAddress, pageCount],
  )

  const [hasMoreToken, setHasMoreToken] = useState(false)

  const prevQuery = usePrevious(debouncedQuery)
  useEffect(() => {
    if (prevQuery !== debouncedQuery) {
      fetchListTokens(0)
    }
    // need call api when only debouncedQuery change
  }, [debouncedQuery, prevQuery, fetchListTokens])

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
    if (!debouncedQuery && tab === Tab.All) {
      setFetchedTokens(Object.values(defaultTokens))
    }
    setActiveTab(tab)
  }

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
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
          <SearchIcon size={18} color={theme.border} />
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
              className={cn('h-8 focus:no-underline', activeTab === Tab.All ? 'text-primary' : 'text-text')}
            >
              <span className="text-sm font-medium">
                <Trans>All</Trans>
              </span>
            </ButtonText>

            <ButtonText
              data-active={isImportedTab}
              onClick={() => onChangeTab(Tab.Imported)}
              data-testid="tab-import"
              className={cn('h-8 focus:no-underline', isImportedTab ? 'text-primary' : 'text-text')}
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
          hasMore={hasMoreToken}
          customChainId={customChainId}
          setTokenToShowInfo={setTokenToShowInfo}
        />
      ) : (
        <NoResult />
      )}
    </ContentWrapper>
  )
}
