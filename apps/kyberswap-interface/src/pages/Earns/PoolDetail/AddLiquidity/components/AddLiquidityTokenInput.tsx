import { NETWORKS_INFO, Pool, Token, ZapRouteDetail } from '@kyber/schema'
import TokenSelectorModal, { MAX_TOKENS, TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { InfoHelper } from '@kyber/ui'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Text } from 'rebass'
import styled from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import TokenAmountInput, {
  TokenAmountInputSkeleton,
} from 'pages/Earns/PoolDetail/AddLiquidity/components/TokenAmountInput'
import { formatDisplayNumber } from 'utils/numbers'

const AddTokenButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 0;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.primary};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  :hover {
    filter: brightness(1.12);
  }
`

const EMPTY_TOKENS: Token[] = []
const EMPTY_BALANCES: Record<string, bigint> = {}
const EMPTY_PRICES: Record<string, number> = {}

interface AddLiquidityTokenInputProps {
  context: {
    chainId: number
    pool: Pool
  }
  wallet?: {
    address?: string
    onConnect?: () => void
  }
  value?: {
    tokens?: Token[]
    amounts?: string
    balances?: Record<string, bigint>
    prices?: Record<string, number>
    route?: ZapRouteDetail | null
  }
  onTrackEvent?: (eventName: string, data?: Record<string, any>) => void
  onTokensChange?: (nextTokens: Token[]) => void
  onAmountsChange?: (nextAmounts: string) => void
}

const AddLiquidityTokenInput = ({
  context,
  wallet,
  value,
  onTrackEvent,
  onTokensChange,
  onAmountsChange,
}: AddLiquidityTokenInputProps) => {
  const theme = useTheme()
  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false)
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string>()

  const { chainId, pool } = context
  const { token0, token1 } = pool

  const currentTokens = value?.tokens ?? EMPTY_TOKENS
  const currentAmounts = value?.amounts || ''
  const currentBalances = value?.balances ?? EMPTY_BALANCES
  const currentPrices = value?.prices ?? EMPTY_PRICES
  const currentRoute = value?.route
  const amountList = useMemo(() => currentAmounts.split(','), [currentAmounts])

  const share = useMemo(() => {
    if ('liquidity' in pool && currentRoute?.positionDetails?.addedLiquidity) {
      try {
        const currentLiquidity = BigInt(pool.liquidity)
        const addedLiquidity = BigInt(currentRoute.positionDetails.addedLiquidity)
        const totalLiquidity = currentLiquidity + addedLiquidity

        if (addedLiquidity <= 0n || totalLiquidity <= 0n) return undefined

        const shareScaled = (addedLiquidity * 1_000_000n) / totalLiquidity
        return Number(shareScaled) / 1_000_000
      } catch {
        return undefined
      }
    }

    const reserveUsd = Number((pool as any).reserveUsd || (pool as any).stats?.tvl || 0)
    const routedAddedUsd = Number(currentRoute?.positionDetails?.addedAmountUsd || 0)

    if (reserveUsd > 0 && routedAddedUsd > 0) {
      return routedAddedUsd / (reserveUsd + routedAddedUsd)
    }

    if (!reserveUsd) return undefined

    const totalUsdAmount = currentTokens.reduce((sum, token, index) => {
      const amount = Number(amountList[index] || 0)
      const price = currentPrices[token.address.toLowerCase()] || 0

      return sum + amount * price
    }, 0)

    if (!totalUsdAmount) return undefined

    return totalUsdAmount / reserveUsd
  }, [amountList, currentPrices, currentRoute, currentTokens, pool])

  const onCloseTokenSelectModal = useCallback(() => {
    setOpenTokenSelectModal(false)
    setTokenAddressSelected(undefined)
  }, [])

  const openTokenSelectModalForToken = useCallback((address?: string) => {
    setTokenAddressSelected(address)
    setOpenTokenSelectModal(true)
  }, [])

  const handleSetAmount = useCallback(
    (tokenIndex: number, nextAmount: string) => {
      const nextAmounts = [...amountList]
      nextAmounts[tokenIndex] = nextAmount
      onAmountsChange?.(nextAmounts.join(','))
    },
    [amountList, onAmountsChange],
  )

  const handleRemoveToken = useCallback(
    (tokenIndex: number) => {
      const nextTokens = [...currentTokens]
      nextTokens.splice(tokenIndex, 1)
      onTokensChange?.(nextTokens)

      const nextAmounts = [...amountList]
      nextAmounts.splice(tokenIndex, 1)
      onAmountsChange?.(nextAmounts.join(','))
    },
    [amountList, currentTokens, onAmountsChange, onTokensChange],
  )

  const handleWrappedSetTokensIn = useCallback(
    (nextTokens: Token[]) => {
      const previousAddresses = currentTokens.map(token => token.address.toLowerCase())
      const newTokens = nextTokens.filter(token => !previousAddresses.includes(token.address.toLowerCase()))

      if (newTokens.length > 0) {
        const poolPair = `${pool.token0.symbol}/${pool.token1.symbol}`
        newTokens.forEach(token => {
          const isZap =
            token.address.toLowerCase() !== pool.token0.address.toLowerCase() &&
            token.address.toLowerCase() !== pool.token1.address.toLowerCase()

          onTrackEvent?.('LIQ_TOKEN_SELECTED', {
            token_symbol: token.symbol,
            token_address: token.address,
            pool_pair: poolPair,
            is_zap: isZap,
            chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
          })
        })
      }

      onTokensChange?.(nextTokens)
    },
    [chainId, currentTokens, onTokensChange, onTrackEvent, pool],
  )

  return (
    <Stack gap={12}>
      {currentTokens.length ? (
        currentTokens.map((token, index) => (
          <TokenAmountInput
            amount={amountList[index] || ''}
            chainId={chainId}
            key={`${token.address}-${index}`}
            tokenIndex={index}
            pool={pool}
            token={token}
            tokenBalances={currentBalances}
            tokenPrices={currentPrices}
            onAmountChange={handleSetAmount}
            onTrackEvent={onTrackEvent}
            onTokenSelectOpen={openTokenSelectModalForToken}
            onTokenRemove={handleRemoveToken}
            tokensCount={currentTokens.length}
          />
        ))
      ) : (
        <TokenAmountInputSkeleton />
      )}

      <Text color={theme.subText} fontSize={12} fontStyle="italic" textAlign="right">
        Your Share:{' '}
        <Text as="span" color={theme.blue} fontStyle="normal" fontWeight={500}>
          {share ? formatDisplayNumber(share, { style: 'percent', significantDigits: 3 }) : '--'}
        </Text>{' '}
        of Active Liquidity
      </Text>

      <AddTokenButton type="button" onClick={() => openTokenSelectModalForToken()}>
        + Add Token(s)
        <InfoHelper
          noneMarginLeft
          placement="bottom"
          text={t`You can zap in with up to ${MAX_TOKENS} tokens`}
          color={theme.primary}
          width="280px"
        />
      </AddTokenButton>

      {openTokenSelectModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <TokenSelectorModal
            chainId={chainId}
            onClose={onCloseTokenSelectModal}
            wallet={{
              account: wallet?.address,
              onConnectWallet: wallet?.onConnect,
            }}
            tokenOptions={{
              tokensIn: currentTokens,
              amountsIn: currentAmounts,
              setTokensIn: handleWrappedSetTokensIn,
              setAmountsIn: nextAmounts => onAmountsChange?.(nextAmounts),
              mode: tokenAddressSelected ? TOKEN_SELECT_MODE.SELECT : TOKEN_SELECT_MODE.ADD,
              selectedTokenAddress: tokenAddressSelected,
              token0Address: token0.address,
              token1Address: token1.address,
            }}
          />,
          document.body,
        )}
    </Stack>
  )
}

export default AddLiquidityTokenInput
