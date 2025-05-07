import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/poolService'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import LiquidityChart from 'pages/Earns/PositionDetail/LiquidityChart'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import {
  InfoRightColumn,
  MaxPriceSection,
  MinPriceSection,
  PositionAction,
  PositionActionWrapper,
  PriceSection,
  RevertIconWrapper,
} from 'pages/Earns/PositionDetail/styles'
import { CoreProtocol } from 'pages/Earns/constants'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition } from 'pages/Earns/types'
import { MAX_TICK, MIN_TICK, nearestUsableTick, priceToClosestTick } from 'pages/Earns/uniswapv3'
import { isForkFrom } from 'pages/Earns/utils'
import { formatDisplayNumber, toString } from 'utils/numbers'

const RightSection = ({
  position,
  onOpenZapMigration,
}: {
  position: ParsedPosition
  onOpenZapMigration: (props: ZapMigrationInfo) => void
}) => {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { stableCoins } = useStableCoins(position.chain.id)
  const { data: pool } = usePoolDetailQuery({ chainId: position.chain.id, ids: position.pool.address })
  const [revert, setRevert] = useState(false)
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false)

  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget()

  const price = useMemo(
    () => (!revert ? position.priceRange.current : 1 / position.priceRange.current),
    [position.priceRange, revert],
  )
  const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)

  const priceRange = useMemo(() => {
    if (!pool) return

    const tickSpacing = pool?.positionInfo.tickSpacing
    const minTick = nearestUsableTick(MIN_TICK, tickSpacing)
    const maxTick = nearestUsableTick(MAX_TICK, tickSpacing)

    if (minTick === undefined || maxTick === undefined) return

    const minPrice = toString(Number(position.priceRange.min.toFixed(18)))
    const maxPrice = toString(Number(position.priceRange.max.toFixed(18)))

    const tickLower =
      minPrice === '0' ? minTick : priceToClosestTick(minPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)
    const tickUpper = priceToClosestTick(maxPrice, pool.tokens[0].decimals, pool.tokens[1].decimals, false)
    const usableTickLower = nearestUsableTick(Number(tickLower), tickSpacing)
    const usableTickUpper = nearestUsableTick(Number(tickUpper), tickSpacing)

    if (usableTickLower === undefined || usableTickUpper === undefined) return
    if (usableTickLower === minTick && usableTickUpper === maxTick) return ['0', '∞']
    else {
      const parsedMinPrice = toString(
        Number((!revert ? position.priceRange.min : 1 / position.priceRange.max).toFixed(18)),
      )
      const parsedMaxPrice = toString(
        Number((!revert ? position.priceRange.max : 1 / position.priceRange.min).toFixed(18)),
      )
      return [
        formatDisplayNumber(parsedMinPrice, { significantDigits: 6 }),
        formatDisplayNumber(parsedMaxPrice, { significantDigits: 6 }),
      ]
    }
  }, [pool, position, revert])

  const onOpenIncreaseLiquidityWidget = () => {
    if (!position) return
    handleOpenZapIn({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: isUniv2 ? account || '' : position.tokenId,
    })
  }

  useEffect(() => {
    if (!pool || !position.chain.id || !pool.tokens?.[0] || defaultRevertChecked || !stableCoins.length) return
    setDefaultRevertChecked(true)
    const isToken0Native =
      pool.tokens[0].address.toLowerCase() ===
      NativeCurrencies[position.chain.id as ChainId].wrapped.address.toLowerCase()
    const isToken0Stable = stableCoins.some(coin => coin.address === pool.tokens[0].address)
    const isToken1Stable = stableCoins.some(coin => coin.address === pool.tokens[1].address)
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevert(true)
  }, [defaultRevertChecked, pool, position.chain.id, stableCoins])

  return (
    <>
      {zapInWidget}
      {zapOutWidget}

      <InfoRightColumn halfWidth={isUniv2}>
        {price ? (
          <PriceSection>
            <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'}>
              <Text fontSize={14} color={theme.subText}>
                {t`Current Price`}
              </Text>
              <Text fontSize={14}>
                1 {!revert ? position.token0.symbol : position.token1.symbol} ={' '}
                {formatDisplayNumber(price, {
                  significantDigits: 6,
                })}{' '}
                {!revert ? position.token1.symbol : position.token0.symbol}
              </Text>
            </Flex>
            <RevertIconWrapper onClick={() => setRevert(!revert)}>
              <RevertPriceIcon width={12} height={12} />
            </RevertIconWrapper>
          </PriceSection>
        ) : null}

        <LiquidityChart
          chainId={position.chain.id}
          poolAddress={position.pool.address}
          price={price}
          minPrice={position.priceRange.min}
          maxPrice={position.priceRange.max}
          revertPrice={revert}
        />

        {priceRange ? (
          <Flex sx={{ gap: '16px' }}>
            <MinPriceSection>
              <Text fontSize={14} color={theme.subText}>
                {t`Min Price`}
              </Text>
              <Text fontSize={18} marginBottom={2} marginTop={2}>
                {priceRange[0]}
              </Text>
              <Text fontSize={14} color={theme.subText}>
                {!revert ? position.token1.symbol : position.token0.symbol} per{' '}
                {!revert ? position.token0.symbol : position.token1.symbol}
              </Text>
            </MinPriceSection>
            <MaxPriceSection>
              <Text fontSize={14} color={theme.subText}>
                {t`Max Price`}
              </Text>
              <Text fontSize={18} marginBottom={2} marginTop={2}>
                {priceRange[1]}
              </Text>
              <Text fontSize={14} color={theme.subText}>
                {!revert ? position.token1.symbol : position.token0.symbol} per{' '}
                {!revert ? position.token0.symbol : position.token1.symbol}
              </Text>
            </MaxPriceSection>
          </Flex>
        ) : null}

        {isUniv2 && <PositionHistory position={position} />}

        <PositionActionWrapper>
          <PositionAction
            outlineDefault
            onClick={() => {
              handleOpenZapOut({
                position: {
                  dex: position.dex.id,
                  chainId: position.chain.id,
                  poolAddress: position.pool.address,
                  id: isUniv2 ? account || '' : position.tokenId,
                },
              })
            }}
          >{t`Remove Liquidity`}</PositionAction>
          <PositionAction onClick={onOpenIncreaseLiquidityWidget}>{t`Add Liquidity`}</PositionAction>
        </PositionActionWrapper>
      </InfoRightColumn>
    </>
  )
}

export default RightSection
