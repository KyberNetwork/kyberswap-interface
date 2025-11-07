import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { PlusCircle } from 'react-feather'
import { useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import { usePoolDetailQuery } from 'services/zapEarn'

import { ReactComponent as IconReposition } from 'assets/svg/earn/ic_reposition.svg'
import { ReactComponent as RevertPriceIcon } from 'assets/svg/earn/ic_revert_price.svg'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { useStableCoins } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
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
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { EARN_DEXES, Exchange } from 'pages/Earns/constants'
import { CoreProtocol } from 'pages/Earns/constants/coreProtocol'
import { CheckClosedPositionParams } from 'pages/Earns/hooks/useClosedPositions'
import useZapInWidget from 'pages/Earns/hooks/useZapInWidget'
import { ZapMigrationInfo } from 'pages/Earns/hooks/useZapMigrationWidget'
import useZapOutWidget from 'pages/Earns/hooks/useZapOutWidget'
import { ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { getNftManagerContractAddress } from 'pages/Earns/utils'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

const RightSection = ({
  position,
  onOpenZapMigration,
  totalLiquiditySection,
  aprSection,
  onRefreshPosition,
  initialLoading,
  isNotAccountOwner,
  positionOwnerAddress,
  triggerClose,
  setTriggerClose,
  setReduceFetchInterval,
  onReposition,
}: {
  position?: ParsedPosition
  onOpenZapMigration: (props: ZapMigrationInfo) => void
  totalLiquiditySection: React.ReactNode
  aprSection: React.ReactNode
  onRefreshPosition: (props: CheckClosedPositionParams) => void
  initialLoading: boolean
  isNotAccountOwner: boolean
  positionOwnerAddress?: string | null
  triggerClose: boolean
  setTriggerClose: (value: boolean) => void
  setReduceFetchInterval: (value: boolean) => void
  onReposition: (e: React.MouseEvent, position: ParsedPosition) => void
}) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { exchange, chainId, positionId } = useParams()

  const { account } = useActiveWeb3React()
  const { stableCoins } = useStableCoins(Number(chainId) as ChainId)
  const { data: pool } = usePoolDetailQuery(
    { chainId: Number(chainId) as ChainId, address: position?.pool.address || '' },
    { skip: !position, pollingInterval: 15_000 },
  )
  const [revert, setRevert] = useState(false)
  const [defaultRevertChecked, setDefaultRevertChecked] = useState(false)

  const { widget: zapInWidget, handleOpenZapIn } = useZapInWidget({
    onOpenZapMigration,
    triggerClose,
    setTriggerClose,
  })
  const { widget: zapOutWidget, handleOpenZapOut } = useZapOutWidget((props: CheckClosedPositionParams) => {
    onRefreshPosition(props)
    setReduceFetchInterval(true)
  }, true)

  const price = useMemo(
    () => (!position?.priceRange ? 0 : !revert ? position.priceRange.current : 1 / position.priceRange.current),
    [position?.priceRange, revert],
  )
  const isUniv2 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV2

  const explorerUrl = useMemo(() => {
    if (!position || !chainId) return null

    const baseUrl = NETWORKS_INFO[+chainId as ChainId]?.etherscanUrl
    if (!baseUrl) return null

    if (isUniv2) {
      return `${baseUrl}/token/${position.pool.address}?a=${positionOwnerAddress || account}`
    }

    const [nftManagerAddressFromRoute] = (positionId || '').split('-')
    const nftManagerAddress = nftManagerAddressFromRoute?.startsWith('0x')
      ? nftManagerAddressFromRoute
      : getNftManagerContractAddress(position.dex.id, position.chain.id)

    return `${baseUrl}/nft/${nftManagerAddress}/${position.tokenId}`
  }, [account, chainId, isUniv2, position, positionId, positionOwnerAddress])

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
    if (!pool || !chainId || !pool.tokens?.[0] || defaultRevertChecked || !stableCoins.length) return
    setDefaultRevertChecked(true)
    const isToken0Native =
      pool.tokens[0].address.toLowerCase() ===
      NativeCurrencies[Number(chainId) as ChainId].wrapped.address.toLowerCase()
    const isToken0Stable = stableCoins.some(coin => coin.address === pool.tokens[0].address)
    const isToken1Stable = stableCoins.some(coin => coin.address === pool.tokens[1].address)
    if (isToken0Stable || (isToken0Native && !isToken1Stable)) setRevert(true)
  }, [defaultRevertChecked, pool, chainId, stableCoins])

  const isUnfinalized = position?.isUnfinalized
  const isUniV4 = EARN_DEXES[exchange as Exchange]?.isForkFrom === CoreProtocol.UniswapV4
  const isClosed = position?.status === PositionStatus.CLOSED
  const isOutRange = position?.status === PositionStatus.OUT_RANGE

  const repositionDisabled = initialLoading || !position || isClosed
  const increaseDisabled = initialLoading || (isUniV4 && isClosed)
  const subActionDisabled = isClosed || (!isOutRange ? repositionDisabled : increaseDisabled)

  return (
    <>
      {zapInWidget}
      {zapOutWidget}

      <InfoRightColumn halfWidth={isUniv2}>
        {/* Total Liquidity */}
        {/* Est. Position APR */}
        {!upToSmall && (
          <Flex flexWrap={'wrap'} alignItems={'center'} sx={{ gap: '12px' }}>
            {totalLiquiditySection}
            {aprSection}
          </Flex>
        )}

        {price || initialLoading ? (
          <PriceSection>
            <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'}>
              <Text fontSize={14} color={theme.subText}>
                {t`Current Price`}
              </Text>
              {initialLoading ? (
                <PositionSkeleton width={160} height={16} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={160} height={16} text={t`Finalizing...`} />
              ) : (
                position && (
                  <>
                    <Text fontSize={14}>
                      1 {!revert ? position.token0.symbol : position.token1.symbol} ={' '}
                      {formatDisplayNumber(price, {
                        significantDigits: 8,
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

        {!isUniv2 && (
          <Flex sx={{ gap: '16px' }}>
            <MinPriceSection>
              <Text fontSize={14} color={theme.subText}>
                {t`Min Price`}
              </Text>

              {initialLoading ? (
                <PositionSkeleton width={80} height={21} style={{ marginBottom: 8, marginTop: 8 }} />
              ) : isUnfinalized ? (
                <PositionSkeleton
                  width={80}
                  height={21}
                  style={{ marginBottom: 8, marginTop: 8 }}
                  text={t`Finalizing...`}
                />
              ) : (
                <Text fontSize={18} marginBottom={2} marginTop={2}>
                  {(!revert && position?.priceRange.isMinPrice) || (revert && position?.priceRange.isMaxPrice)
                    ? '0'
                    : position?.priceRange?.min && position?.priceRange?.max
                    ? formatDisplayNumber(!revert ? position.priceRange.min : 1 / position.priceRange.max, {
                        significantDigits: 8,
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
                <PositionSkeleton
                  width={80}
                  height={21}
                  style={{ marginBottom: 8, marginTop: 8 }}
                  text={t`Finalizing...`}
                />
              ) : (
                <Text fontSize={18} marginBottom={2} marginTop={2}>
                  {(!revert && position?.priceRange.isMaxPrice) || (revert && position?.priceRange.isMinPrice)
                    ? '∞'
                    : position?.priceRange?.min && position?.priceRange?.max
                    ? formatDisplayNumber(!revert ? position.priceRange.max : 1 / position.priceRange.min, {
                        significantDigits: 8,
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
        )}

        {isUniv2 && <PositionHistory position={position} />}

        {!isUniv2 && (
          <PositionActionWrapper>
            <Flex
              color={!subActionDisabled ? theme.primary : theme.subText}
              alignItems={'center'}
              marginBottom={-3}
              sx={{ gap: 1, cursor: !subActionDisabled ? 'pointer' : 'not-allowed' }}
              onClick={e => {
                if (!isOutRange ? repositionDisabled : increaseDisabled) return
                if (!isOutRange) {
                  onReposition(e, position as ParsedPosition)
                } else {
                  onOpenIncreaseLiquidityWidget()
                }
              }}
            >
              {!isOutRange ? <IconReposition width={20} /> : <PlusCircle width={20} />}
              <Text>{!isOutRange ? t`Reposition to new range` : t`Increase Liquidity`}</Text>
            </Flex>
          </PositionActionWrapper>
        )}
        <PositionActionWrapper>
          <PositionAction
            outlineDefault
            disabled={initialLoading || isNotAccountOwner || !position || isClosed}
            onClick={() => {
              if (initialLoading || isClosed || !position) return
              handleOpenZapOut({
                position: {
                  dex: position.dex.id,
                  chainId: position.chain.id,
                  poolAddress: position.pool.address,
                  id: isUniv2 ? account || '' : position.tokenId,
                },
              })
            }}
          >
            {t`Remove Liquidity`}
          </PositionAction>
          {isNotAccountOwner ? (
            <PositionAction
              disabled={!explorerUrl}
              onClick={() => {
                if (!explorerUrl) return
                window.open(explorerUrl, '_blank', 'noopener,noreferrer')
              }}
            >
              {t`View on Explorer`}
            </PositionAction>
          ) : (
            <PositionAction
              disabled={!isOutRange ? increaseDisabled : repositionDisabled}
              onClick={e => {
                if (!isOutRange ? increaseDisabled : repositionDisabled) return
                if (isOutRange) {
                  onReposition(e, position)
                } else {
                  onOpenIncreaseLiquidityWidget()
                }
              }}
            >
              {!isOutRange ? t`Increase Liquidity` : t`Reposition to new range`}
            </PositionAction>
          )}
        </PositionActionWrapper>
      </InfoRightColumn>
    </>
  )
}

export default RightSection
