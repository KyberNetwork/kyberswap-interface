import { ChainId, Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trash } from 'react-feather'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import { SUGGESTED_BASES } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import {
  useAllTokens,
  useIsTokenActive,
  useIsUserAddedToken,
  useSearchInactiveTokenLists, // useSearchInactiveTokenListsV2,
  useToken,
} from 'hooks/Tokens'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { useRemoveUserAddedToken, useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { filterTokens } from 'utils/filtering'

import { useActiveWeb3React } from '../../hooks'
import { ButtonText, CloseIcon, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import ImportRow from './ImportRow'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchIcon, SearchInput, SearchWrapper, Separator } from './styleds'

enum Tab {
  All,
  Imported,
}

const ContentWrapper = styled(Column)`
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
const MAX_FAVORITE_PAIR = 12

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showManageView: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
  customChainId?: ChainId
}
const isTokenInCommonBase = (token: Token, chainId: ChainId | undefined) =>
  chainId ? SUGGESTED_BASES[chainId].find(e => e.address.toLowerCase() === token.address.toLowerCase()) : false

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen,
  showImportView,
  setImportToken,
  customChainId,
}: CurrencySearchProps) {
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const { favoriteTokens, toggleFavoriteToken } = useUserFavoriteTokens(chainId)

  const allTokens = useAllTokens()
  const tokenImports = useUserAddedTokens()

  const tokenComparator = useTokenComparator(false)

  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)
  const searchToken = useToken(debouncedQuery)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)
  const isSearchTokenActive = useIsTokenActive(searchToken?.wrapped)

  const showETH: boolean = useMemo(() => {
    const nativeToken = chainId && nativeOnChain(chainId)
    const s = debouncedQuery.toLowerCase().trim()
    return !!nativeToken?.symbol?.toLowerCase().startsWith(s)
  }, [debouncedQuery, chainId])

  const tokenImportsFiltered = useMemo(() => {
    return (debouncedQuery ? filterTokens(tokenImports, debouncedQuery) : tokenImports).sort(tokenComparator)
  }, [debouncedQuery, tokenImports, tokenComparator])

  const filteredTokens: Token[] = useMemo(() => {
    if (isAddressSearch) return searchToken ? [searchToken.wrapped] : []
    return filterTokens(Object.values(allTokens), debouncedQuery)
  }, [isAddressSearch, searchToken, allTokens, debouncedQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (searchToken) return [searchToken.wrapped]
    const sorted = filteredTokens.sort((a, b) => {
      const isACommon = isTokenInCommonBase(a, chainId)
      const isBCommon = isTokenInCommonBase(b, chainId)
      return isACommon ? -1 : isBCommon ? 1 : tokenComparator(a, b)
    })
    const symbolMatch = debouncedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol?.toLowerCase() === symbolMatch[0]),
      ...sorted.filter(token => token.symbol?.toLowerCase() !== symbolMatch[0]),
    ]
  }, [filteredTokens, debouncedQuery, searchToken, tokenComparator, chainId])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
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

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const checksumInput = isAddress(input)
    setSearchQuery(checksumInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = searchQuery.toLowerCase().trim()
        if (s === 'eth') {
          handleCurrencySelect(nativeOnChain(chainId as ChainId))
        } else if (filteredSortedTokens.length > 0) {
          if (
            filteredSortedTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
            filteredSortedTokens.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokens[0])
          }
        }
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery, chainId],
  )

  const handleClickFavorite = useCallback(
    (e: React.MouseEvent, currency: Currency) => {
      e.stopPropagation()
      const address = currency?.wrapped.address

      const currentList = favoriteTokens?.addresses || []
      const isAddFavorite = currency.isNative
        ? !favoriteTokens?.includeNativeToken
        : !currentList.find(el => el === address) // else remove favorite
      const curTotal =
        currentList.filter(address => !!allTokens[address]).length + (favoriteTokens?.includeNativeToken ? 1 : 0)
      if (!chainId || (isAddFavorite && curTotal === MAX_FAVORITE_PAIR)) return

      if (currency.isNative) {
        toggleFavoriteToken({
          chainId,
          isNative: true,
        })
        return
      }

      if (currency.isToken) {
        toggleFavoriteToken({
          chainId,
          address,
        })
      }
    },
    [chainId, allTokens, favoriteTokens, toggleFavoriteToken],
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens: Token[] = useSearchInactiveTokenLists(debouncedQuery)
  // todo: tien phan use filteredInactiveTokens2 instead of useSearchInactiveTokenLists
  // const filteredInactiveTokens2: Token[] = useSearchInactiveTokenListsV2(debouncedQuery)
  // console.log(filteredInactiveTokens2)

  const combinedTokens = useMemo(() => {
    const currencies: Currency[] = filteredSortedTokens.concat(filteredInactiveTokens)
    if (showETH && chainId) currencies.unshift(nativeOnChain(chainId))
    return currencies
  }, [showETH, chainId, filteredSortedTokens, filteredInactiveTokens])

  const commonTokens = useMemo(() => {
    return combinedTokens.filter(token => {
      if (token.isNative) {
        return favoriteTokens?.includeNativeToken
      }
      if (token.isToken) {
        return favoriteTokens?.addresses?.includes(token.address)
      }
      return false
    })
  }, [combinedTokens, favoriteTokens?.addresses, favoriteTokens?.includeNativeToken])

  const visibleCurrencies: Currency[] = useMemo(() => {
    return activeTab === Tab.Imported ? tokenImportsFiltered : combinedTokens
  }, [activeTab, combinedTokens, tokenImportsFiltered])

  const removeToken = useRemoveUserAddedToken()

  const removeImportedToken = useCallback(
    (token: Token) => {
      if (!chainId) return
      removeToken(chainId, token.address)
      if (favoriteTokens?.addresses.includes(token.address))
        // remove in favorite too
        toggleFavoriteToken({
          chainId,
          address: token.address,
        })
    },
    [chainId, toggleFavoriteToken, removeToken, favoriteTokens?.addresses],
  )

  const removeAllImportToken = () => {
    if (tokenImports) {
      tokenImports.forEach(removeImportedToken)
    }
  }
  const isImportedTab = activeTab === Tab.Imported

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={20} display="flex">
            <Trans>Select a token</Trans>
            <InfoHelper
              size={16}
              text={
                <Trans>
                  Find a token by searching for its name or symbol or by pasting its address below
                  <br />
                  <br />
                  You can select and trade any token on KyberSwap.
                </Trans>
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
            chainId={chainId}
            tokens={commonTokens}
            handleClickFavorite={handleClickFavorite}
            onSelect={handleCurrencySelect}
            selectedCurrency={selectedCurrency}
          />
        )}
        <RowBetween>
          <Flex
            sx={{
              columnGap: '24px',
            }}
          >
            <TabButton data-active={activeTab === Tab.All} onClick={() => setActiveTab(Tab.All)}>
              <Text as="span" fontSize={14} fontWeight={500}>
                <Trans>All</Trans>
              </Text>
            </TabButton>

            <TabButton data-active={isImportedTab} onClick={() => setActiveTab(Tab.Imported)}>
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
          <ButtonClear onClick={removeAllImportToken}>
            <Trash size={13} />
            <Trans>Clear All</Trans>
          </ButtonClear>
        </Flex>
      )}

      {searchToken && !searchTokenIsAdded && !isSearchTokenActive ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken.wrapped} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : visibleCurrencies?.length > 0 ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CurrencyList
                removeImportedToken={removeImportedToken}
                height={height}
                currencies={visibleCurrencies}
                inactiveTokens={filteredInactiveTokens}
                isImportedTab={isImportedTab}
                breakIndex={
                  activeTab === Tab.All
                    ? filteredInactiveTokens.length && filteredSortedTokens
                      ? filteredSortedTokens.length
                      : undefined
                    : undefined
                }
                handleClickFavorite={handleClickFavorite}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showImportView={showImportView}
                setImportToken={setImportToken}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <TYPE.main color={theme.text3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </TYPE.main>
        </Column>
      )}
    </ContentWrapper>
  )
}
