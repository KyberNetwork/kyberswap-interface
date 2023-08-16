import { ChainId, Currency, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import axios from 'axios'
import { rgba } from 'polished'
import { stringify } from 'querystring'
import { ChangeEvent, KeyboardEvent, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash } from 'react-feather'
import { usePrevious } from 'react-use'
import { Flex, Text } from 'rebass'
import { useImportTokenMutation } from 'services/ksSetting'
import styled from 'styled-components'

import Column from 'components/Column'
import InfoHelper from 'components/InfoHelper'
import { RowBetween } from 'components/Row'
import { KS_SETTING_API } from 'constants/env'
import { isEVM, isSolana } from 'constants/networks'
import { Z_INDEXS } from 'constants/styles'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import {
  fetchListTokenByAddresses,
  fetchTokenByAddress,
  formatAndCacheToken,
  useAllTokens,
  useFetchERC20TokenFromRPC,
} from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { ButtonText, CloseIcon, TYPE } from 'theme'
import { filterTruthy, isAddress } from 'utils'
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

export const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding-bottom: 10px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-bottom: 0px;
  `};
`

const TabButton = styled(ButtonText)`
  height: 32px;
  color: ${({ theme }) => theme.text};
  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};
  }

  :focus {
    text-decoration: none;
  }
`

const ButtonClear = styled.div`
  border-radius: 24px;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  display: flex;
  align-items: center;
  padding: 5px 10px;
  gap: 5px;
  cursor: pointer;
`

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
      const token = await fetchTokenByAddress(search, chainId, signal)
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
    const url = `${KS_SETTING_API}/v1/tokens?${stringify(params)}`

    const response = await axios.get(url, { signal })
    const { tokens = [] } = response.data.data
    return filterTruthy(tokens.map(formatAndCacheToken))
  } catch (error) {
    return []
  }
}

export const NoResult = ({ msg }: { msg?: ReactNode }) => {
  const theme = useTheme()
  return (
    <Column style={{ padding: '20px', height: '100%' }} data-testid="no-token-result">
      <TYPE.main color={theme.text3} textAlign="center" mb="20px">
        {msg || <Trans>No results found.</Trans>}
      </TYPE.main>
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
}: CurrencySearchProps) {
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isQueryValidEVMAddress = isEVM(chainId) && !!isAddress(chainId, debouncedQuery)
  const isQueryValidSolanaAddress = isSolana(chainId) && !!isAddress(chainId, debouncedQuery)

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

  const fetchERC20TokenFromRPC = useFetchERC20TokenFromRPC()

  // input eth => output filter weth, input weth => output filter eth
  const filterWrapFunc = useCallback(
    (token: Currency | undefined) => {
      if (filterWrap && otherSelectedCurrency?.equals(WETH[chainId])) {
        return !isTokenNative(token, token?.chainId)
      }
      if (filterWrap && otherSelectedCurrency && isTokenNative(otherSelectedCurrency, otherSelectedCurrency?.chainId)) {
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
      onCurrencySelect(isTokenNative(currency, currency.chainId) ? NativeCurrencies[currency.chainId] : currency)
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
      inputRef.current?.focus()
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
  const [importTokensToKsSettings] = useImportTokenMutation()
  const fetchListTokens = useCallback(
    async (page?: number) => {
      const nextPage = (page ?? pageCount) + 1
      let tokens: WrappedTokenInfo[] = []

      if (debouncedQuery) {
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

            importTokensToKsSettings([
              {
                chainId: String(rawToken.chainId),
                address: rawToken.address,
              },
            ]).catch(err => {
              console.error('import token err', err)
            })
          }
        } else if (tokens.length === 0 && isQueryValidSolanaAddress) {
          // TODO: query tokens from Solana token db
        }
      } else {
        tokens = Object.values(defaultTokens)
      }

      setPageCount(nextPage)
      setFetchedTokens(current => (nextPage === 1 ? [] : current).concat(tokens))
      setHasMoreToken(tokens.length === PAGE_SIZE && !!debouncedQuery)
    },
    [
      chainId,
      debouncedQuery,
      defaultTokens,
      fetchERC20TokenFromRPC,
      isQueryValidEVMAddress,
      isQueryValidSolanaAddress,
      pageCount,
      importTokensToKsSettings,
    ],
  )

  const [hasMoreToken, setHasMoreToken] = useState(false)

  const prevQuery = usePrevious(debouncedQuery)
  useEffect(() => {
    if (prevQuery !== debouncedQuery) {
      fetchListTokens(0)
    }
    // need call api when only debouncedQuery change
  }, [debouncedQuery, prevQuery, fetchListTokens])

  const isImportedTab = activeTab === Tab.Imported

  const visibleCurrencies: Currency[] = useMemo(() => {
    return isImportedTab ? tokenImportsFiltered : filteredSortedTokens
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

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={20} display="flex">
            {title || <Trans>Select a token</Trans>}
            <InfoHelper
              zIndexTooltip={Z_INDEXS.MODAL}
              size={16}
              fontSize={14}
              text={
                tooltip || (
                  <Text>
                    <Trans>
                      Find a token by searching for its name or symbol or by pasting its address below.
                      <br />
                      You can select and trade any token on KyberSwap.
                    </Trans>
                  </Text>
                )
              }
            />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Text style={{ color: theme.subText, fontSize: 12 }}>
          <Trans>
            You can search and select <span style={{ color: theme.text }}>any token</span> on KyberSwap
          </Trans>
        </Text>

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
          <Flex justifyContent={'center'}>
            <Text fontSize={12} color={theme.subText}>
              Loading ...
            </Text>
          </Flex>
        )}
        <RowBetween>
          <Flex
            sx={{
              columnGap: '24px',
            }}
          >
            <TabButton data-active={activeTab === Tab.All} onClick={() => setActiveTab(Tab.All)} data-testid="tab-all">
              <Text as="span" fontSize={14} fontWeight={500}>
                <Trans>All</Trans>
              </Text>
            </TabButton>

            <TabButton data-active={isImportedTab} onClick={() => setActiveTab(Tab.Imported)} data-testid="tab-import">
              <Text as="span" fontSize={14} fontWeight={500}>
                <Trans>Imported</Trans>
              </Text>
            </TabButton>
          </Flex>
        </RowBetween>
      </PaddedColumn>

      <Separator />

      {isImportedTab && visibleCurrencies.length > 0 && (
        <Flex
          justifyContent="space-between"
          alignItems="center"
          style={{ color: theme.subText, fontSize: 12, padding: '15px 20px 10px 20px' }}
        >
          <div>
            <Trans>{visibleCurrencies.length} Custom Tokens</Trans>
          </div>
          <ButtonClear onClick={removeAllImportToken} data-testid="button-clear-all-import-token">
            <Trash size={13} />
            <Trans>Clear All</Trans>
          </ButtonClear>
        </Flex>
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
        />
      ) : (
        <NoResult />
      )}
    </ContentWrapper>
  )
}
