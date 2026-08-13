import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode, useMemo } from 'react'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { Balance } from 'components/TokenSelectorModal/components'
import { NETWORKS_INFO } from 'constants/networks'
import type { NetworkInfo } from 'constants/networks/type'
import { useActiveWeb3React } from 'hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { cn } from 'utils/cn'

type OtherChainTokensProps = {
  tokens: WrappedTokenInfo[]
  loading: boolean
  loadingFallback: ReactNode
  /**
   * The chain the app itself is on. Tokens here are "other chain" only relative to the chain selector,
   * so one can still sit on this chain — those need no network switch and offer a plain row click.
   */
  anchorChainId: ChainId
  /** Pick a token listed here; the parent owns the import and switch-chain gates. */
  onSelect: (token: WrappedTokenInfo) => void
}

export const OtherChainTokens = ({
  tokens,
  loading,
  loadingFallback,
  anchorChainId,
  onSelect,
}: OtherChainTokensProps) => {
  const { account } = useActiveWeb3React()

  // Only the rows on the app's own chain show a balance, and they all share that chain, so one lookup
  // serves them — balances for the rows still behind a network switch would be noise anyway.
  const anchorChainTokens = useMemo(
    () => tokens.filter(token => token.chainId === anchorChainId),
    [tokens, anchorChainId],
  )
  const anchorChainBalances = useCurrencyBalances(anchorChainTokens, anchorChainId)
  const balanceByAddress = useMemo(
    () =>
      anchorChainTokens.reduce<Record<string, CurrencyAmount<Currency> | undefined>>((map, token, index) => {
        map[token.address] = anchorChainBalances[index]
        return map
      }, {}),
    [anchorChainTokens, anchorChainBalances],
  )

  // Mirrors the in-list balance column: the amount once known, a skeleton while a connected wallet's
  // balances land, and "0" with no wallet (where the balance stays undefined).
  const renderBalance = (token: WrappedTokenInfo) => {
    const balance = balanceByAddress[token.address]
    if (balance) return <Balance balance={balance} />
    if (account) return <Skeleton width={56} height={18} className="my-[3px]" variant="darkSubtle" />
    return (
      <span className="max-w-full truncate text-xs text-text sm:text-sm" data-testid="token-balance">
        0
      </span>
    )
  }

  if (loading && !tokens.length) {
    return loadingFallback
  }

  if (!tokens.length) return null

  return (
    <Stack className="h-full pb-2" data-testid="other-chain-tokens">
      <div className="px-5 py-3 text-sm font-medium text-subText">
        <Trans>Available on other chains</Trans>
      </div>
      <Stack className="min-h-0 flex-1 gap-2 overflow-y-auto px-2">
        {tokens.map(token => {
          const networkInfo = NETWORKS_INFO[token.chainId] as NetworkInfo
          const isDimmed = !token.isWhitelisted
          const needsSwitch = token.chainId !== anchorChainId

          return (
            <HStack
              key={`${token.chainId}-${token.address}`}
              data-testid="other-chain-token-item"
              onClick={() => onSelect(token)}
              className="min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-lg px-3 py-1 hover:bg-subText-04"
            >
              <HStack className="min-w-0 items-center gap-2">
                <CurrencyLogo currency={token} size="24px" style={isDimmed ? { opacity: 0.5 } : undefined} />
                <Stack className={cn('min-w-0 items-start gap-0.5', isDimmed && 'opacity-50')}>
                  <span className="truncate font-medium text-text">{token.symbol}</span>
                  <HStack as="span" className="min-w-0 items-center gap-1">
                    <img src={networkInfo.icon} alt={networkInfo.name} className="size-3 rounded-full" />
                    <span className="truncate text-xs font-light text-subText">{networkInfo.name}</span>
                  </HStack>
                </Stack>
              </HStack>
              {needsSwitch ? (
                <ButtonPrimary
                  data-testid="other-chain-switch-btn"
                  width="fit-content"
                  padding="6px 12px"
                  fontWeight={500}
                  fontSize="14px"
                  className={cn(isDimmed && 'opacity-50')}
                  onClick={event => {
                    event.stopPropagation()
                    onSelect(token)
                  }}
                >
                  <Trans>Switch Chain</Trans>
                </ButtonPrimary>
              ) : (
                renderBalance(token)
              )}
            </HStack>
          )
        })}
      </Stack>
    </Stack>
  )
}
