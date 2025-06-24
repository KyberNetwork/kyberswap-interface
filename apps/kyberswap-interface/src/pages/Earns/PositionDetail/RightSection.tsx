import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/poolService'

import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { PositionSkeleton } from 'pages/Earns/PositionDetail'
import LiquidityChart, { LiquidityChartSkeleton } from 'pages/Earns/PositionDetail/LiquidityChart'
import PositionHistory from 'pages/Earns/PositionDetail/PositionHistory'
import {
  ChartPlaceholder,
  ChartSkeletonWrapper,
  InfoRightColumn,
  MaxPriceSection,
  MinPriceSection,
  PositionAction,
  PositionActionWrapper,
  PriceSection,
  RevertIconWrapper,
} from 'pages/Earns/PositionDetail/styles'
import { CoreProtocol, Exchange, POSSIBLE_FARMING_PROTOCOLS } from 'pages/Earns/constants'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const RightSection = ({
  position,
  onOpenZapMigration,
  totalLiquiditySection,
  aprSection,
  refetch,
  initialLoading,
}: {
  position?: ParsedPosition
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  totalLiquiditySection: React.ReactNode
  aprSection: React.ReactNode
  refetch: () => void
  initialLoading: boolean
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { protocol, chainId } = useParams()

  const { account } = useActiveWeb3React()
  const { stableCoins } = useStableCoins(Number(chainId) as ChainId)
  const { data: pool } = usePoolDetailQuery(
    { chainId: Number(chainId) as ChainId, ids: position?.pool.address || '' },
    { skip: !position, pollingInterval: 15_000 },
  )
  const [revert, setRevert] = useState(false)
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false)

  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget(refetch)

  const price = useMemo(
    () => (!position?.priceRange ? 0 : !revert ? position.priceRange.current : 1 / position.priceRange.current),
    [position?.priceRange, revert],
  )
  const isUniv2 = isForkFrom(protocol as Exchange, CoreProtocol.UniswapV2)

  const onOpenIncreaseLiquidityWidget = () => {
    if (!position) return
    handleOpenZapIn({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: position.status === PositionStatus.CLOSED ? undefined : isUniv2 ? account || '' : position.tokenId,
    })
  }

  useEffect(() => {
    if (!pool || !chainId || !pool.tokens?.[0] || defaultRevertChecked || !stableCoins.length) return
    setDefaultRevertChecked(true)
    const isToken0Native =
      pool.tokens[0].address.toLowerCase() ===
      NativeCurrencies[Number(chainId) as ChainId].wrapped.address.toLowerCase()
    const isToken0Stable = stableCoins.some(coin => coin.address === pool.tokens[0].address)
    const isToken1Stable = stableCoins.some(coin => coin.address === pool.tokens[1].address)
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevert(true)
  }, [defaultRevertChecked, pool, chainId, stableCoins])

  const isFarmingPossible = POSSIBLE_FARMING_PROTOCOLS.includes(protocol as Exchange)
  const isUnfinalized = position?.isUnfinalized

  return (
    <>
      {zapInWidget}
      {zapOutWidget}

      <InfoRightColumn halfWidth={isUniv2}>
        {!upToSmall &&
        (position?.pool.isFarming ||
          (initialLoading && isFarmingPossible) ||
          Number(position?.rewards.claimableUsdValue || 0) > 0) ? (
          <Flex flexWrap={'wrap'} alignItems={'center'} sx={{ gap: '12px' }}>
            {totalLiquiditySection}
            {aprSection}
          </Flex>
        ) : null}

        {price || initialLoading ? (
          <PriceSection>
            <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'}>
              <Text fontSize={14} color={theme.subText}>
                {t`Current Price`}
              </Text>
              {initialLoading ? (
                <PositionSkeleton width={160} height={16} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={160} height={16} text="Finalizing..." />
              ) : (
                position && (
                  <>
                    <Text fontSize={14}>
                      1 {!revert ? position.token0.symbol : position.token1.symbol} ={' '}
                      {formatDisplayNumber(price, {
                        significantDigits: 6,
                      })}{' '}
                      {!revert ? position.token1.symbol : position.token0.symbol}
                    </Text>
                  </>
                )
              )}
            </Flex>
            <RevertIconWrapper onClick={() => setRevert(!revert)}>
              <RevertPriceIcon width={12} height={12} />
            </RevertIconWrapper>
          </PriceSection>
        ) : null}

        {!isUniv2 &&
          (initialLoading || !position || isUnfinalized ? (
            <LiquidityChartSkeleton />
          ) : (
            <ChartPlaceholder>
              <LiquidityChart
                chainId={Number(chainId)}
                poolAddress={position.pool.address}
                price={price}
                minPrice={position.priceRange.min}
                maxPrice={position.priceRange.max}
                revertPrice={revert}
              />
              <ChartSkeletonWrapper>
                <LiquidityChartSkeleton />
              </ChartSkeletonWrapper>
            </ChartPlaceholder>
          ))}

        <Flex sx={{ gap: '16px' }}>
          <MinPriceSection>
            <Text fontSize={14} color={theme.subText}>
              {t`Min Price`}
            </Text>

            {initialLoading ? (
              <PositionSkeleton width={80} height={21} style={{ marginBottom: 8, marginTop: 8 }} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={80} height={21} style={{ marginBottom: 8, marginTop: 8 }} text="Finalizing..." />
            ) : (
              <Text fontSize={18} marginBottom={2} marginTop={2}>
                {position?.priceRange?.min && position?.priceRange?.max
                  ? formatDisplayNumber(!revert ? position.priceRange.min : 1 / position.priceRange.max, {
                      significantDigits: 6,
                    })
                  : ''}
              </Text>
            )}

            {initialLoading ? (
              <PositionSkeleton width={110} height={16} />
            ) : (
              <Text fontSize={14} color={theme.subText}>
                {!revert ? position?.token1.symbol : position?.token0.symbol} per{' '}
                {!revert ? position?.token0.symbol : position?.token1.symbol}
              </Text>
            )}
          </MinPriceSection>
          <MaxPriceSection>
            <Text fontSize={14} color={theme.subText}>
              {t`Max Price`}
            </Text>

            {initialLoading ? (
              <PositionSkeleton width={80} height={21} style={{ marginBottom: 8, marginTop: 8 }} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={80} height={21} style={{ marginBottom: 8, marginTop: 8 }} text="Finalizing..." />
            ) : (
              <Text fontSize={18} marginBottom={2} marginTop={2}>
                {position?.priceRange?.min && position?.priceRange?.max
                  ? formatDisplayNumber(!revert ? position.priceRange.max : 1 / position.priceRange.min, {
                      significantDigits: 6,
                    })
                  : ''}
              </Text>
            )}

            {initialLoading ? (
              <PositionSkeleton width={110} height={16} />
            ) : (
              <Text fontSize={14} color={theme.subText}>
                {!revert ? position?.token1.symbol : position?.token0.symbol} per{' '}
                {!revert ? position?.token0.symbol : position?.token1.symbol}
              </Text>
            )}
          </MaxPriceSection>
        </Flex>

        {isUniv2 && <PositionHistory position={position} />}

        <PositionActionWrapper>
          <PositionAction
            outlineDefault
            disabled={initialLoading || !position || position?.status === PositionStatus.CLOSED}
            onClick={() => {
              if (initialLoading || position?.status === PositionStatus.CLOSED || !position) return

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
          <PositionAction
            disabled={initialLoading}
            onClick={() => {
              if (!position || initialLoading) return
              onOpenIncreaseLiquidityWidget()
            }}
          >
            {!position || position.status === PositionStatus.CLOSED ? t`Add Liquidity` : t`Increase Liquidity`}
          </PositionAction>
        </PositionActionWrapper>
      </InfoRightColumn>
    </>
  )
}

export default RightSection
