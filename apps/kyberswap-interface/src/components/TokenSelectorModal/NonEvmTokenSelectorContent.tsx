import { Trans, t } from '@lingui/macro'
import { useWallet } from '@solana/wallet-adapter-react'
import { ReactNode, useMemo, useRef, useState } from 'react'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { HStack, Stack } from 'components/Stack'
import { TabBar } from 'components/TokenSelectorModal/TabBar'
import { TokenListHeader } from 'components/TokenSelectorModal/TokenListHeader'
import { TokenListSkeleton } from 'components/TokenSelectorModal/TokenListSkeleton'
import { Balance, NoResult, SearchControl, SearchInput, SearchWrapper } from 'components/TokenSelectorModal/components'
import {
  BALANCE_COLUMN_CLASS,
  TOKEN_ROW_CLASS,
  TOKEN_ROW_HOVER_CLASS,
  TokenSelectorTab,
} from 'components/TokenSelectorModal/constants'
import { useBitcoinWallet } from 'components/Web3Provider/BitcoinProvider'
import { useSolanaTokenBalances } from 'components/Web3Provider/SolanaProvider'
import useDebounce from 'hooks/useDebounce'
import { useNearIntentsTokens } from 'pages/CrossChainSwap/adapters/NearIntentsAdapter/useNearIntentsTokens'
import { BitcoinToken, Currency, NonEvmChain, NonEvmCurrency } from 'pages/CrossChainSwap/adapters/types'
import { useNearBalances } from 'pages/CrossChainSwap/hooks/useNearBalances'
import { useSolanaTokens } from 'pages/CrossChainSwap/hooks/useSolanaTokens'
import { shortenHash } from 'utils/address'
import { cn } from 'utils/cn'

type Props = {
  chain: NonEvmChain
  selectedCurrency?: Currency | null
  networkSelector?: ReactNode
  onSelect: (currency: NonEvmCurrency) => void
}

const NonEvmTokenSelectorContent = ({ chain, selectedCurrency, networkSelector, onSelect }: Props) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  const isSolana = chain === NonEvmChain.Solana
  const isBitcoin = chain === NonEvmChain.Bitcoin

  // Wallet balances and token catalogs for the selected network.
  const { balances: nearBalances } = useNearBalances(chain === NonEvmChain.Near)
  const solanaBalances = useSolanaTokenBalances()
  const { publicKey: solanaAddress } = useWallet()
  const { balance: bitcoinBalance, walletInfo: bitcoinWallet } = useBitcoinWallet()

  const { nearTokens, isLoadingNearTokens } = useNearIntentsTokens(chain !== NonEvmChain.Near)
  const { solanaTokens, isLoadingSolanaTokens } = useSolanaTokens(debouncedQuery, !isSolana)
  const loading = !isBitcoin && (isSolana ? isLoadingSolanaTokens : isLoadingNearTokens)

  // Match search results and prioritize held Solana tokens.
  const tokens = useMemo<NonEvmCurrency[]>(() => {
    if (isBitcoin) {
      const search = query.trim().toLowerCase()
      return [BitcoinToken].filter(token =>
        [token.symbol, token.name].some(value => value.toLowerCase().includes(search)),
      )
    }

    if (isSolana) {
      return [...solanaTokens].sort(
        (a, b) => (solanaBalances?.[b.id]?.balance || 0) - (solanaBalances?.[a.id]?.balance || 0),
      )
    }

    const search = query.trim().toLowerCase()
    return nearTokens.filter(
      token =>
        token.blockchain === NonEvmChain.Near &&
        [token.symbol, token.contractAddress, token.assetId].some(value => value.toLowerCase().includes(search)),
    )
  }, [isBitcoin, isSolana, solanaTokens, solanaBalances, nearTokens, query])

  const getRawBalance = (id: string) => {
    if (isBitcoin) return bitcoinWallet.address ? bitcoinBalance : undefined
    if (isSolana) return solanaAddress ? solanaBalances[id]?.rawAmount : undefined
    return nearBalances[id]
  }

  const selectedId =
    selectedCurrency &&
    ('assetId' in selectedCurrency
      ? selectedCurrency.assetId
      : 'id' in selectedCurrency
      ? selectedCurrency.id
      : selectedCurrency.symbol)

  return (
    <Stack className="min-h-0 min-w-0 flex-1 gap-3">
      <Stack className="shrink-0 gap-2">
        <HStack className="items-center gap-3">
          <SearchWrapper className="flex-1">
            <SearchInput
              autoFocus
              ref={inputRef}
              className="bg-white-04"
              aria-label="Search token"
              placeholder={t`Search by name, symbol or address`}
              value={query}
              onChange={event => setQuery(event.target.value)}
              autoComplete="off"
            />
            <SearchControl
              query={query}
              onClear={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
            />
          </SearchWrapper>
          {networkSelector}
        </HStack>
        <TabBar tabs={[TokenSelectorTab.All]} activeTab={TokenSelectorTab.All} />
      </Stack>
      <Stack role="tabpanel" id="token-selector-panel" className="min-h-0 flex-1 gap-2">
        {(loading || tokens.length > 0) && (
          <TokenListHeader activeTab={TokenSelectorTab.All} metricColumn="volume24h" sort={null} />
        )}
        {loading ? (
          <TokenListSkeleton activeTab={TokenSelectorTab.All} showFavoriteIcon={false} showUsdBalance={false} />
        ) : !tokens.length ? (
          <NoResult />
        ) : (
          <Stack className="ks-scrollbar min-h-0 flex-1 gap-2 overflow-y-auto" aria-label="Tokens">
            {tokens.map(token => {
              const id = 'id' in token ? token.id : 'assetId' in token ? token.assetId : token.symbol
              const rawBalance = getRawBalance(id)
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={id === selectedId}
                  data-selected={id === selectedId}
                  onClick={() => onSelect(token)}
                  className={cn(
                    TOKEN_ROW_CLASS,
                    TOKEN_ROW_HOVER_CLASS,
                    'shrink-0 border-0 bg-transparent text-left text-text',
                  )}
                >
                  <HStack className="min-w-0 flex-1 items-center gap-2">
                    <img
                      src={token.logo || UnknownToken}
                      alt=""
                      className="size-6 shrink-0 rounded-full"
                      onError={({ currentTarget }) => {
                        currentTarget.onerror = null
                        currentTarget.src = UnknownToken
                      }}
                    />
                    <Stack className="min-w-0 gap-0.5">
                      <span className="truncate text-xs font-medium text-text sm:text-sm">{token.symbol}</span>
                      <span className="truncate text-xs text-gray">
                        {'id' in token
                          ? shortenHash(token.id, 4)
                          : 'assetId' in token
                          ? shortenHash(token.contractAddress || token.assetId, 4)
                          : token.name}
                      </span>
                    </Stack>
                  </HStack>
                  <Stack className={cn('shrink-0 items-end overflow-hidden', BALANCE_COLUMN_CLASS)}>
                    {rawBalance === undefined ? (
                      <span className="max-w-full truncate text-xs tabular-nums text-text sm:text-sm">--</span>
                    ) : (
                      <Balance balance={formatUnits(BigInt(rawBalance), token.decimals)} />
                    )}
                  </Stack>
                </button>
              )
            })}
          </Stack>
        )}
      </Stack>
      <div className="shrink-0 text-left text-xs font-medium italic leading-4 text-subText">
        <Trans>On-chain data for informational purposes only. Not financial advice.</Trans>
      </div>
    </Stack>
  )
}

export default NonEvmTokenSelectorContent
