import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack, Stack } from 'components/Stack'
import { NETWORKS_INFO } from 'constants/networks'
import type { NetworkInfo } from 'constants/networks/type'
import { useChangeNetwork } from 'hooks/web3/useChangeNetwork'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { cn } from 'utils/cn'

type OtherChainTokensProps = {
  tokens: WrappedTokenInfo[]
  loading: boolean
  loadingFallback: ReactNode
}

export const OtherChainTokens = ({ tokens, loading, loadingFallback }: OtherChainTokensProps) => {
  const { changeNetwork } = useChangeNetwork()

  if (loading && !tokens.length) {
    return loadingFallback
  }

  if (!tokens.length) return null

  return (
    <Stack className="h-full">
      <div className="px-5 py-3 text-sm font-medium text-subText">
        <Trans>Available on other chains</Trans>
      </div>
      <Stack className="min-h-0 flex-1 gap-2 overflow-y-auto px-2">
        {tokens.map(token => {
          const networkInfo = NETWORKS_INFO[token.chainId] as NetworkInfo
          const isDimmed = !token.isWhitelisted

          return (
            <HStack
              key={`${token.chainId}-${token.address}`}
              className="min-h-14 w-full items-center justify-between gap-4 rounded-lg px-3 py-1 hover:bg-subText-04"
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
              <ButtonPrimary
                width="fit-content"
                padding="6px 12px"
                fontWeight={500}
                fontSize="14px"
                className={cn(isDimmed && 'opacity-50')}
                onClick={() => changeNetwork(token.chainId)}
              >
                <Trans>Switch Chain</Trans>
              </ButtonPrimary>
            </HStack>
          )
        })}
      </Stack>
    </Stack>
  )
}
