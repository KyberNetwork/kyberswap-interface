import { Trans, t } from '@lingui/macro'
import { HTMLAttributes, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import Loader from 'components/Loader'
import Modal from 'components/Modal'
import { HStack, Stack } from 'components/Stack'
import {
  ContentWrapper,
  PaddedColumn,
  SearchIcon,
  SearchInput,
  SearchWrapper,
  Separator,
} from 'components/TokenSelectorModal/components'
import useDebounce from 'hooks/useDebounce'
import { BitcoinToken, Chain, Currency, NonEvmChain } from 'pages/CrossChainSwap/adapters'
import { type NearToken, useNearTokens } from 'pages/CrossChainSwap/hooks/useNearTokens'
import { type SolanaToken, useSolanaTokens } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { CloseIcon } from 'theme'
import { shortenHash } from 'utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type SolanaTokenOption = SolanaToken & { assetId: SolanaToken['id'] }
type BitcoinTokenOption = typeof BitcoinToken & { assetId: string }
type TokenSelectorNonEvmToken = NearToken | SolanaTokenOption | BitcoinTokenOption

const TokenRow = ({ className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-1',
      'data-[selected=true]:bg-primary-20 [@media(hover:hover)]:hover:bg-primary-15 [@media(hover:hover)]:data-[selected=true]:hover:bg-primary-25',
      className,
    )}
    {...rest}
  />
)

const SearchLoading = () => (
  <Stack className="h-full items-center gap-3 p-5 pt-8" data-testid="token-search-loading">
    <Loader size="24px" />
    <p className="text-center font-medium text-text3">
      <Trans>Loading...</Trans>
    </p>
  </Stack>
)

const isNearToken = (currency: Currency): currency is NearToken => 'assetId' in currency
const isSolanaToken = (currency: Currency): currency is SolanaToken => 'id' in currency

const getCurrencyTokenId = (currency?: Currency) => {
  if (!currency) return undefined
  if (isNearToken(currency)) return currency.assetId
  if (isSolanaToken(currency)) return currency.id
  return undefined
}

type TokenSelectorNonEvmModalProps = {
  isOpen: boolean
  onDismiss: () => void
  onSelectCurrency: (currency: Currency) => void
  nearBalances: Record<string, string>
  selectedChain?: Chain
  selectedCurrency?: Currency
  solanaBalances: Record<string, { balance: number; rawAmount: string; decimals: number }>
}

const TokenSelectorNonEvmModal = ({
  isOpen,
  onDismiss,
  onSelectCurrency,
  nearBalances,
  selectedChain,
  selectedCurrency,
  solanaBalances,
}: TokenSelectorNonEvmModalProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const deboundcedSearchQuery = useDebounce(searchQuery, 300)
  const inputRef = useRef<HTMLInputElement>(null)

  const isSolana = selectedChain === NonEvmChain.Solana
  const isBitcoin = selectedChain === NonEvmChain.Bitcoin
  const searchText = searchQuery.trim().toLowerCase()
  const selectedTokenId = getCurrencyTokenId(selectedCurrency)

  const { nearTokens, isLoadingNearTokens } = useNearTokens(!isOpen || selectedChain !== NonEvmChain.Near)
  const { solanaTokens, isLoadingSolanaTokens } = useSolanaTokens(deboundcedSearchQuery, !isOpen || !isSolana)
  const tokenOnNears = useMemo(() => nearTokens.filter(token => token.blockchain === NonEvmChain.Near), [nearTokens])
  const isLoadingTokens = isSolana ? isLoadingSolanaTokens : isLoadingNearTokens

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      inputRef.current?.focus()
    }
  }, [isOpen])

  const filteredTokens = useMemo<TokenSelectorNonEvmToken[]>(() => {
    if (isSolana) {
      return solanaTokens
        .map(token => ({ ...token, assetId: token.id }))
        .sort((a, b) => {
          const balanceA = solanaBalances[a.id]?.balance || 0
          const balanceB = solanaBalances[b.id]?.balance || 0

          return balanceB - balanceA
        })
    }

    if (isBitcoin) {
      return [
        {
          ...BitcoinToken,
          assetId: BitcoinToken.symbol,
        },
      ]
    }

    return tokenOnNears.filter(token => {
      const symbol = token.symbol.toLowerCase()
      const contractAddress = token.contractAddress.toLowerCase()
      const assetId = token.assetId.toLowerCase()

      return symbol.includes(searchText) || contractAddress.includes(searchText) || assetId.includes(searchText)
    })
  }, [isBitcoin, isSolana, searchText, solanaBalances, solanaTokens, tokenOnNears])

  const getTokenBalanceDisplay = (token: { assetId: string; decimals: number }) => {
    if (isSolana) {
      return formatDisplayNumber(solanaBalances[token.assetId]?.balance || 0, { significantDigits: 8 })
    }

    return formatDisplayNumber(formatUnits(BigInt(nearBalances[token.assetId] || '0'), token.decimals), {
      significantDigits: 8,
    })
  }

  const isMobileHorizontal = Math.abs(window.orientation) === 90 && isMobile

  return (
    <Modal
      isOpen={isOpen && !isBitcoin}
      onDismiss={onDismiss}
      maxHeight={isMobileHorizontal ? 100 : 80}
      minHeight={80}
      height={isMobileHorizontal ? '95vh' : undefined}
    >
      <ContentWrapper>
        <PaddedColumn>
          <HStack className="items-center justify-between">
            <HStack as="span" className="text-xl font-medium">
              <Trans>Select a token</Trans>
            </HStack>
            <CloseIcon onClick={onDismiss} />
          </HStack>
          <span className="text-xs font-medium text-subText">
            <Trans>Search and select a token on the selected network.</Trans>
          </span>

          <SearchWrapper>
            <SearchInput
              type="text"
              id="token-search-input"
              data-testid="token-search-input"
              placeholder={t`Search by token name, token symbol or address`}
              value={searchQuery}
              ref={inputRef}
              onChange={e => {
                setSearchQuery(e.target.value)
              }}
              autoComplete="off"
            />
            <SearchIcon size={18} className="text-border" />
          </SearchWrapper>
        </PaddedColumn>

        <Separator />

        <Stack className="min-h-0 flex-1 gap-2 overflow-y-scroll p-2">
          {isLoadingTokens ? (
            <SearchLoading />
          ) : !filteredTokens.length ? (
            <Stack className="h-full p-3">
              <p className="text-center font-medium text-text3">
                <Trans>No results found.</Trans>
              </p>
            </Stack>
          ) : (
            filteredTokens.map(item => {
              const isSelected = selectedCurrency?.symbol === item.symbol && selectedTokenId === item.assetId
              const dimmedClassName = 'opacity-50'

              return (
                <TokenRow
                  key={item.assetId}
                  data-selected={isSelected}
                  role="button"
                  onClick={() => {
                    onSelectCurrency(item)
                    onDismiss()
                  }}
                >
                  <HStack className="min-w-0 flex-1 items-center gap-3">
                    <img
                      src={item.logo}
                      alt={item.symbol}
                      width={24}
                      height={24}
                      style={{ borderRadius: '50%', opacity: 0.5 }}
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null
                        currentTarget.src = UnknownToken
                      }}
                    />
                    <Stack className={cn('min-w-0 gap-0.5', dimmedClassName)}>
                      <span className="truncate font-medium">{item.symbol}</span>
                      {isSolana && (
                        <span className="truncate text-xs font-light text-subText">{shortenHash(item.assetId, 4)}</span>
                      )}
                    </Stack>
                  </HStack>
                  <span className={cn('shrink-0 text-base max-md:text-sm', dimmedClassName)}>
                    {getTokenBalanceDisplay(item)}
                  </span>
                </TokenRow>
              )
            })
          )}
        </Stack>
      </ContentWrapper>
    </Modal>
  )
}

export default TokenSelectorNonEvmModal
