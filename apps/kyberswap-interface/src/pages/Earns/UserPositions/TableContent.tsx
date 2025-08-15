import { formatAprNumber, toString } from '@kyber/utils/dist/number'
import { MAX_TICK, MIN_TICK, priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useMemo, useState } from 'react'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import { Loader2 } from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS, PAIR_CATEGORY } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import DropdownAction from 'pages/Earns/UserPositions/DropdownAction'
import MigrationModal from 'pages/Earns/UserPositions/MigrationModal'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import {
  Badge,
  BadgeType,
  ChainImage,
  Divider,
  EmptyPositionText,
  ImageContainer,
  PositionActionWrapper,
  PositionOverview,
  PositionRow,
  PositionTableBody,
  PositionValueLabel,
  PositionValueWrapper,
} from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import {
  CoreProtocol,
  DEXES_SUPPORT_COLLECT_FEE,
  EarnDex,
  LIMIT_TEXT_STYLES,
  protocolGroupNameToExchangeMapping,
} from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import useFarmingStablePools from 'pages/Earns/hooks/useFarmingStablePools'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { ZapOutInfo } from 'pages/Earns/hooks/useZapOutWidget'
import { FeeInfo, ParsedPosition, PositionStatus, SuggestedPool } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
import { checkEarlyPosition } from 'pages/Earns/utils/position'
import { useWalletModalToggle } from 'state/application/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export interface FeeInfoFromRpc extends FeeInfo {
  id: string
  timeRemaining: number
}

export default function TableContent({
  positions,
  feeInfoFromRpc,
  setFeeInfoFromRpc,
  onOpenZapInWidget,
  onOpenZapOut,
  refetchPositions,
}: {
  positions: Array<ParsedPosition>
  feeInfoFromRpc: FeeInfoFromRpc[]
  setFeeInfoFromRpc: (feeInfo: FeeInfoFromRpc[]) => void
  onOpenZapInWidget: ({ pool, positionId }: ZapInInfo) => void
  onOpenZapOut: ({ position }: ZapOutInfo) => void
  refetchPositions: () => void
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const [positionThatClaimingFees, setPositionThatClaimingFees] = useState<ParsedPosition | null>(null)
  const [positionThatClaimingRewards, setPositionThatClaimingRewards] = useState<ParsedPosition | null>(null)
  const [positionToMigrate, setPositionToMigrate] = useState<ParsedPosition | null>(null)

  const {
    claimModal: claimFeesModal,
    onOpenClaim: onOpenClaimFees,
    claiming: feesClaiming,
  } = useCollectFees({
    refetchAfterCollect: () => {
      handleFetchUnclaimedFee(positionThatClaimingFees)
      setPositionThatClaimingFees(null)
    },
  })

  const {
    claimModal: claimRewardsModal,
    onOpenClaim: onOpenClaimRewards,
    claiming: rewardsClaiming,
  } = useKemRewards(refetchPositions)

  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()

  const uniqueChainIds = useMemo(() => {
    if (!positions || positions.length === 0) return []
    const chainIds = positions.map(position => position.chain.id)
    return [...new Set(chainIds)]
  }, [positions])

  const farmingPoolsByChain = useFarmingStablePools({ chainIds: uniqueChainIds })

  const handleFetchUnclaimedFee = useCallback(
    async (position: ParsedPosition | null) => {
      if (!position) return

      const feeFromRpc = await getUnclaimedFeesInfo(position)

      const { tokenId } = position
      const feeInfoToAdd = {
        ...feeFromRpc,
        id: tokenId,
        timeRemaining: 60 * 2,
      }

      const feeInfoFromRpcClone = [...feeInfoFromRpc]
      const index = feeInfoFromRpcClone.findIndex(feeInfo => feeInfo.id === tokenId)
      if (index !== -1) feeInfoFromRpcClone[index] = feeInfoToAdd
      else feeInfoFromRpcClone.push(feeInfoToAdd)

      setFeeInfoFromRpc(feeInfoFromRpcClone)
    },
    [feeInfoFromRpc, setFeeInfoFromRpc],
  )

  const handleOpenIncreaseLiquidityWidget = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
    onOpenZapInWidget({
      pool: {
        dex: position.dex.id,
        chainId: position.chain.id,
        address: position.pool.address,
      },
      positionId: position.status === PositionStatus.CLOSED ? undefined : isUniv2 ? account || '' : position.tokenId,
    })
  }

  const handleOpenZapOut = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    const isUniv2 = isForkFrom(position.dex.id, CoreProtocol.UniswapV2)
    onOpenZapOut({
      position: {
        dex: position.dex.id,
        chainId: position.chain.id,
        id: isUniv2 ? account || '' : position.tokenId,
        poolAddress: position.pool.address,
      },
    })
  }

  const handleClaimFees = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (position.pool.isUniv2 || feesClaiming || position.unclaimedFees === 0) return
    setPositionThatClaimingFees(position)
    onOpenClaimFees(position)
  }

  const handleClaimRewards = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()
    if (rewardsClaiming || position.rewards.unclaimedUsdValue === 0) return
    setPositionThatClaimingRewards(position)
    onOpenClaimRewards(position)
  }

  const handleMigrateToKem = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()

    if (!!position.suggestionPool) {
      handleOpenMigration(position, position.suggestionPool)
    } else if (
      position.pool.category === PAIR_CATEGORY.STABLE &&
      farmingPoolsByChain[position.chain.id]?.pools.length > 0
    )
      setPositionToMigrate(position)
  }

  const handleOpenMigration = (sourcePosition: ParsedPosition, targetPool: SuggestedPool) => {
    const sourceMinPrice = sourcePosition.priceRange.min
    const sourceMaxPrice = sourcePosition.priceRange.max
    const targetToken0Decimals = targetPool.token0.decimals
    const targetToken1Decimals = targetPool.token1.decimals

    const dontNeedRevert =
      sourcePosition.token0.decimals === targetToken0Decimals && sourcePosition.token1.decimals === targetToken1Decimals

    const isMinPrice = sourcePosition.priceRange.isMinPrice
    const isMaxPrice = sourcePosition.priceRange.isMaxPrice

    const tickLower = sourcePosition.pool.isUniv2
      ? undefined
      : dontNeedRevert
      ? isMinPrice
        ? MIN_TICK
        : priceToClosestTick(toString(sourceMinPrice), targetToken0Decimals, targetToken1Decimals)
      : isMaxPrice
      ? MAX_TICK
      : priceToClosestTick(toString(1 / sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)

    const tickUpper = sourcePosition.pool.isUniv2
      ? undefined
      : dontNeedRevert
      ? isMaxPrice
        ? MAX_TICK
        : priceToClosestTick(toString(sourceMaxPrice), targetToken0Decimals, targetToken1Decimals)
      : isMinPrice
      ? MIN_TICK
      : priceToClosestTick(toString(1 / sourceMinPrice), targetToken0Decimals, targetToken1Decimals)

    handleOpenZapMigration({
      chainId: sourcePosition.chain.id,
      from: {
        dex: sourcePosition.dex.id,
        poolId: sourcePosition.pool.address,
        positionId: sourcePosition.pool.isUniv2 ? account || '' : sourcePosition.tokenId,
      },
      to: {
        dex: targetPool.poolExchange,
        poolId: targetPool.address,
      },
      initialTick:
        tickLower && tickUpper
          ? {
              tickLower: tickLower,
              tickUpper: tickUpper,
            }
          : undefined,
    })
  }

  const emptyPosition = (
    <EmptyPositionText>
      <IconEarnNotFound />
      <Flex flexDirection={upToSmall ? 'column' : 'row'} sx={{ gap: 1 }} marginBottom={12}>
        <Text color={theme.subText}>{t`You don't have any liquidity positions yet`}.</Text>
        <Link to={APP_PATHS.EARN_POOLS}>{t`Explore Liquidity Pools to get started`}!</Link>
      </Flex>
      {!account && <PositionActionBtn onClick={toggleWalletModal}>Connect Wallet</PositionActionBtn>}
    </EmptyPositionText>
  )

  const migrationModal =
    positionToMigrate && farmingPoolsByChain[positionToMigrate.chain.id]?.pools.length > 0 ? (
      <MigrationModal
        positionToMigrate={positionToMigrate}
        farmingPools={farmingPoolsByChain[positionToMigrate.chain.id].pools}
        onOpenMigration={handleOpenMigration}
        onClose={() => setPositionToMigrate(null)}
      />
    ) : null

  return (
    <>
      {claimFeesModal}
      {claimRewardsModal}
      {zapMigrationWidget}
      {migrationModal}

      <PositionTableBody>
        {account && positions && positions.length > 0
          ? positions.map((position, index) => {
              const {
                id,
                tokenId,
                token0,
                token1,
                pool,
                dex,
                chain,
                totalValue,
                priceRange,
                apr,
                unclaimedFees,
                status,
                rewards,
                isUnfinalized,
              } = position
              const feesClaimDisabled =
                !DEXES_SUPPORT_COLLECT_FEE[dex.id as EarnDex] || unclaimedFees === 0 || feesClaiming
              const rewardsClaimDisabled = rewardsClaiming || position.rewards.claimableUsdValue === 0
              const isStablePair = pool.category === PAIR_CATEGORY.STABLE
              const isEarlyPosition = checkEarlyPosition(position)
              const isWaitingForRewards = pool.isFarming && rewards.totalUsdValue === 0 && isEarlyPosition

              const actions = (
                <DropdownAction
                  position={position}
                  onOpenIncreaseLiquidityWidget={handleOpenIncreaseLiquidityWidget}
                  onOpenZapOut={handleOpenZapOut}
                  claimFees={{
                    onClaimFee: handleClaimFees,
                    feesClaimDisabled,
                    feesClaiming,
                    positionThatClaimingFees,
                  }}
                  claimRewards={{
                    onClaimRewards: handleClaimRewards,
                    rewardsClaimDisabled,
                    rewardsClaiming,
                    positionThatClaimingRewards,
                  }}
                />
              )

              return (
                <PositionRow
                  key={`${tokenId}-${pool.address}-${index}`}
                  to={APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', !pool.isUniv2 ? id : pool.address)
                    .replace(':chainId', chain.id.toString())
                    .replace(':protocol', protocolGroupNameToExchangeMapping[dex.id] || dex.id)}
                >
                  {/* Overview info */}
                  <PositionOverview>
                    <Flex alignItems={'center'} sx={{ gap: 2 }} flexWrap={'wrap'}>
                      <ImageContainer>
                        <TokenLogo src={token0.logo} />
                        <TokenLogo src={token1.logo} translateLeft />
                        <ChainImage src={NETWORKS_INFO[chain.id as ChainId]?.icon || chain.logo} alt="" />
                      </ImageContainer>
                      <Text marginLeft={-2} fontSize={upToSmall ? 15 : 16}>
                        {token0.symbol}/{token1.symbol}
                      </Text>
                      {pool.fee ? <Badge>{pool.fee}%</Badge> : null}
                    </Flex>
                    <Flex flexWrap={'wrap'} alignItems={'center'} sx={{ gap: '10px' }}>
                      <Flex alignItems={'center'} sx={{ gap: 1 }}>
                        <MouseoverTooltipDesktopOnly text={dex.id} width="fit-content" placement="bottom">
                          <TokenLogo src={dex.logo} size={16} />
                        </MouseoverTooltipDesktopOnly>
                        <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                          {dex.version}
                        </Text>
                      </Flex>
                      {pool.isUniv2 ? null : (
                        <Text fontSize={upToSmall ? 16 : 14} color={theme.subText}>
                          #{tokenId}
                        </Text>
                      )}
                      {!isUnfinalized && (
                        <Badge
                          type={
                            status === PositionStatus.IN_RANGE
                              ? BadgeType.PRIMARY
                              : status === PositionStatus.OUT_RANGE
                              ? BadgeType.WARNING
                              : BadgeType.DISABLED
                          }
                        >
                          ●{' '}
                          {status === PositionStatus.IN_RANGE
                            ? t`In range`
                            : status === PositionStatus.OUT_RANGE
                            ? t`Out of range`
                            : t`Closed`}
                        </Badge>
                      )}
                    </Flex>
                  </PositionOverview>

                  {/* Actions for Tablet */}
                  {upToLarge && !isUnfinalized && <PositionActionWrapper>{actions}</PositionActionWrapper>}

                  {/* Value info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`Value`}</PositionValueLabel>

                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          {position.totalValueTokens.map(token => (
                            <Text key={`${token.address}-${token.symbol}`}>
                              {formatDisplayNumber(token.amount, { significantDigits: 4 })} {token.symbol}
                            </Text>
                          ))}
                        </>
                      }
                      width="fit-content"
                      placement="bottom"
                    >
                      <Flex alignItems={'center'} sx={{ gap: '6px' }}>
                        <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '80px' }}>
                          {formatDisplayNumber(totalValue, {
                            style: 'currency',
                            significantDigits: 4,
                          })}
                        </Text>
                        {position.isValueUpdating && (
                          <MouseoverTooltipDesktopOnly text={t`Value is updating`} placement="top" width="fit-content">
                            <Loader2 size={12} />
                          </MouseoverTooltipDesktopOnly>
                        )}
                      </Flex>
                    </MouseoverTooltipDesktopOnly>
                  </PositionValueWrapper>

                  {/* APR info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`APR`}</PositionValueLabel>

                    {isUnfinalized ? (
                      <PositionSkeleton width={80} height={19} text="Finalizing..." />
                    ) : isWaitingForRewards ? (
                      <RewardSyncing />
                    ) : (
                      <Flex alignItems={'center'} sx={{ gap: 1 }}>
                        <MouseoverTooltipDesktopOnly
                          text={
                            pool.isFarming ? (
                              <>
                                <Text>
                                  {t`LP Fees APR`}: {formatAprNumber(position.feeApr)}%
                                </Text>
                                <Text>
                                  {t`EG Sharing Reward`}: {formatAprNumber(position.kemEGApr)}%
                                  <br />
                                  {t`LM Reward`}: {formatAprNumber(position.kemLMApr)}%
                                </Text>
                              </>
                            ) : null
                          }
                          width="fit-content"
                          placement="top"
                        >
                          <Text color={pool.isFarming ? theme.primary : theme.text}>{formatAprNumber(apr)}%</Text>
                        </MouseoverTooltipDesktopOnly>

                        {!pool.isFarming &&
                          (!!position.suggestionPool ||
                            (isStablePair && farmingPoolsByChain[chain.id]?.pools.length > 0)) &&
                          position.status !== PositionStatus.CLOSED && (
                            <MouseoverTooltipDesktopOnly
                              text={
                                <>
                                  <Text>
                                    {!!position.suggestionPool
                                      ? pool.fee === position.suggestionPool.feeTier
                                        ? t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
                             Kyberswap Liquidity Mining Program.`
                                        : t`We found a pool with the same pair having Liquidity Mining Program. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`
                                      : t`We found other stable pools participating in the Kyberswap Liquidity Mining Program. Explore and migrate to start earning farming rewards.`}
                                  </Text>
                                  <Text
                                    color={theme.primary}
                                    sx={{ cursor: 'pointer' }}
                                    onClick={e => handleMigrateToKem(e, position)}
                                  >
                                    {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                                  </Text>
                                </>
                              }
                              width={!!position.suggestionPool ? '290px' : '310px'}
                              placement="bottom"
                            >
                              <ArrowRightCircle
                                size={16}
                                color={theme.primary}
                                onClick={e => handleMigrateToKem(e, position)}
                              />
                            </MouseoverTooltipDesktopOnly>
                          )}
                      </Flex>
                    )}
                  </PositionValueWrapper>

                  {/* Unclaimed fees info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Unclaimed Fee`}</PositionValueLabel>

                    {isUnfinalized ? (
                      <PositionSkeleton width={80} height={19} text="Finalizing..." />
                    ) : (
                      <MouseoverTooltipDesktopOnly
                        text={
                          <>
                            <Text>
                              {formatDisplayNumber(token0.unclaimedAmount, { significantDigits: 6 })}{' '}
                              {token0.isNative ? pool.nativeToken.symbol : token0.symbol}
                            </Text>
                            <Text>
                              {formatDisplayNumber(token1.unclaimedAmount, { significantDigits: 6 })}{' '}
                              {token1.isNative ? pool.nativeToken.symbol : token1.symbol}
                            </Text>
                          </>
                        }
                        width="fit-content"
                        placement="bottom"
                      >
                        <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                          {formatDisplayNumber(unclaimedFees, { style: 'currency', significantDigits: 4 })}
                        </Text>
                      </MouseoverTooltipDesktopOnly>
                    )}
                  </PositionValueWrapper>

                  {/* Unclaimed rewards info */}
                  <PositionValueWrapper align={!upToLarge ? 'center' : ''}>
                    <PositionValueLabel>{t`Unclaimed rewards`}</PositionValueLabel>
                    {isUnfinalized ? (
                      <PositionSkeleton width={80} height={19} text="Finalizing..." />
                    ) : isWaitingForRewards ? (
                      <RewardSyncing />
                    ) : (
                      <Flex alignItems={'center'} sx={{ gap: 1 }}>
                        {upToSmall && <IconKem width={20} height={20} />}
                        <MouseoverTooltipDesktopOnly
                          text={
                            <>
                              <Text>
                                {t`In-Progress`}:{' '}
                                {formatDisplayNumber(rewards.inProgressUsdValue, {
                                  significantDigits: 4,
                                  style: 'currency',
                                })}
                              </Text>
                              <Text>
                                {t`Claimable`}:{' '}
                                {formatDisplayNumber(rewards.claimableUsdValue, {
                                  significantDigits: 4,
                                  style: 'currency',
                                })}
                              </Text>
                            </>
                          }
                          width="fit-content"
                          placement="bottom"
                        >
                          <Text>
                            {formatDisplayNumber(rewards.unclaimedUsdValue, {
                              style: 'currency',
                              significantDigits: 4,
                            })}
                          </Text>
                        </MouseoverTooltipDesktopOnly>
                      </Flex>
                    )}
                  </PositionValueWrapper>

                  {!upToLarge && <div />}

                  {/* Balance info */}
                  <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Balance`}</PositionValueLabel>

                    {token0.symbol && token1.symbol ? (
                      <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                        <Text>
                          {formatDisplayNumber(token0.totalProvide, { significantDigits: 4 })} {token0.symbol}
                        </Text>
                        {upToSmall && <Divider />}
                        <Text>
                          {formatDisplayNumber(token1.totalProvide, { significantDigits: 4 })} {token1.symbol}
                        </Text>
                      </Flex>
                    ) : (
                      '--'
                    )}
                  </PositionValueWrapper>

                  {/* Price range info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    {upToLarge ? (
                      isUnfinalized ? null : (
                        <PriceRange
                          minPrice={priceRange.min}
                          maxPrice={priceRange.max}
                          currentPrice={priceRange.current}
                          tickSpacing={pool.tickSpacing}
                          token0Decimals={token0.decimals}
                          token1Decimals={token1.decimals}
                          dex={dex.id as EarnDex}
                        />
                      )
                    ) : isUnfinalized ? (
                      <PositionSkeleton width={80} height={19} text="Finalizing..." />
                    ) : (
                      <PriceRange
                        minPrice={priceRange.min}
                        maxPrice={priceRange.max}
                        currentPrice={priceRange.current}
                        tickSpacing={pool.tickSpacing}
                        token0Decimals={token0.decimals}
                        token1Decimals={token1.decimals}
                        dex={dex.id as EarnDex}
                      />
                    )}
                  </PositionValueWrapper>

                  {/* Actions info */}
                  {!upToLarge && (
                    <PositionValueWrapper align="flex-end">
                      {isUnfinalized ? <PositionSkeleton width={80} height={19} text="Finalizing..." /> : actions}
                    </PositionValueWrapper>
                  )}
                </PositionRow>
              )
            })
          : emptyPosition}
      </PositionTableBody>
    </>
  )
}
