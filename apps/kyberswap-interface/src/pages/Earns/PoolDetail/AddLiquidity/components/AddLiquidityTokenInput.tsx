import { DEXES_INFO, NETWORKS_INFO, Pool, PoolType, Token, UniV3Pool, ZapRouteDetail, univ3Types } from '@kyber/schema'
import TokenSelectorModal, { MAX_TOKENS, TOKEN_SELECT_MODE } from '@kyber/token-selector'
import { InfoHelper } from '@kyber/ui'
import { Trans, t } from '@lingui/macro'
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

const isUniV3Pool = (pool: Pool): pool is UniV3Pool => univ3Types.includes(pool.poolType as PoolType.DEX_UNISWAPV3)

const LiquidityShare = ({ pool, route }: { pool: Pool; route?: ZapRouteDetail | null }) => {
  const theme = useTheme()

  const share = useMemo(() => {
    if (!isUniV3Pool(pool) || !route?.positionDetails?.addedLiquidity) return undefined
    const previousLiquidity = Number(pool.liquidity)
    const addedLiquidity = Number(route.positionDetails.addedLiquidity)
    if (addedLiquidity <= 0) return undefined
    return addedLiquidity / (previousLiquidity + addedLiquidity)
  }, [pool, route])

  const shareDisplay = useMemo(() => {
    if (!share) return '--'
    if (share < 1e-4) return '<0.01%'
    return formatDisplayNumber(share, { style: 'percent', significantDigits: 2 })
  }, [share])

  return (
    <Text color={theme.subText} fontSize={12} fontStyle="italic" textAlign="right">
      Your Share:{' '}
      <Text as="span" color={theme.blue} fontWeight={500}>
        {shareDisplay}
      </Text>{' '}
      of Active Liquidity
    </Text>
  )
}

interface AddLiquidityTokenInputProps {
  context: {
    chainId: number
    poolType: PoolType
    poolAddress: string
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
    slippage?: number
    tickLower?: number | null
    tickUpper?: number | null
  }
  onTrackEvent?: (eventName: string, data?: Record<string, unknown>) => void
  onOpenZapMigration?: (
    position: { exchange: string; poolId: string; positionId: string | number },
    initialTick?: { tickUpper: number; tickLower: number },
    initialSlippage?: number,
  ) => void
  onTokensChange?: (nextTokens: Token[]) => void
  onAmountsChange?: (nextAmounts: string) => void
}

const AddLiquidityTokenInput = ({
  context,
  wallet,
  value,
  onTrackEvent,
  onOpenZapMigration,
  onTokensChange,
  onAmountsChange,
}: AddLiquidityTokenInputProps) => {
  const theme = useTheme()
  const [openTokenSelectModal, setOpenTokenSelectModal] = useState(false)
  const [tokenAddressSelected, setTokenAddressSelected] = useState<string>()

  const { chainId, poolType, poolAddress, pool } = context
  const { token0, token1 } = pool

  const currentTokens = value?.tokens ?? EMPTY_TOKENS
  const currentAmounts = value?.amounts || ''
  const currentBalances = value?.balances ?? EMPTY_BALANCES
  const currentPrices = value?.prices ?? EMPTY_PRICES
  const currentRoute = value?.route
  const currentSlippage = value?.slippage
  const tickLower = value?.tickLower
  const tickUpper = value?.tickUpper
  const amountList = useMemo(() => currentAmounts.split(','), [currentAmounts])

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

  const handleOpenZapMigration = useCallback(
    (position: { exchange: string; poolId: string; positionId: string | number }, initialSlippage?: number) => {
      if (!onOpenZapMigration) return

      const dexNameObj = DEXES_INFO[poolType]?.name
      const dexName = !dexNameObj ? '' : typeof dexNameObj === 'string' ? dexNameObj : dexNameObj[chainId]
      const poolPair = `${pool.token0.symbol}/${pool.token1.symbol}`

      onTrackEvent?.('LIQ_EXISTING_POSITION_SELECTED', {
        position_id: position.positionId?.toString(),
        pool_pair: poolPair,
        pool_protocol: dexName,
        pool_fee_tier: `${pool.fee}%`,
        chain: NETWORKS_INFO[chainId as keyof typeof NETWORKS_INFO]?.name,
      })

      onOpenZapMigration(
        position,
        typeof tickLower === 'number' && typeof tickUpper === 'number' ? { tickLower, tickUpper } : undefined,
        initialSlippage,
      )
    },
    [chainId, onOpenZapMigration, onTrackEvent, pool, poolType, tickLower, tickUpper],
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

      <LiquidityShare pool={pool} route={currentRoute} />

      <AddTokenButton type="button" onClick={() => openTokenSelectModalForToken()}>
        <Trans>+ Add Token(s) or Use Existing Position</Trans>
        <InfoHelper
          noneMarginLeft
          placement="bottom"
          text={t`You can either zap in with up to ${MAX_TOKENS} tokens or select an existing position as the liquidity source`}
          color={theme.primary}
          width="300px"
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
            positionOptions={{
              showUserPositions: !!onOpenZapMigration,
              poolAddress,
              initialSlippage: currentSlippage,
              onSelectLiquiditySource: onOpenZapMigration ? handleOpenZapMigration : undefined,
            }}
          />,
          document.body,
        )}
    </Stack>
  )
}

export default AddLiquidityTokenInput
