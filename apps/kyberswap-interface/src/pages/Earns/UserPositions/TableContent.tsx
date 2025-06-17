import { formatAprNumber } from '@kyber/utils/dist/number'
import { priceToClosestTick } from '@kyber/utils/dist/uniswapv3'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCallback, useState } from 'react'
import { ArrowRightCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'

import { ReactComponent as IconEarnNotFound } from 'assets/svg/earn/ic_earn_not_found.svg'
import { ReactComponent as IconKem } from 'assets/svg/kyber/kem.svg'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { PositionAction as PositionActionBtn } from 'pages/Earns/PositionDetail/styles'
import DropdownAction from 'pages/Earns/UserPositions/DropdownAction'
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
import {
  CoreProtocol,
  DEXES_SUPPORT_COLLECT_FEE,
  EarnDex,
  Exchange,
  LIMIT_TEXT_STYLES,
  protocolGroupNameToExchangeMapping,
} from 'pages/Earns/constants'
import useCollectFees from 'pages/Earns/hooks/useCollectFees'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ZapInInfo } from 'pages/Earns/hooks/useZapInWidget'
import useZapMigrationWidget from 'pages/Earns/hooks/useZapMigrationWidget'
import { ZapOutInfo } from 'pages/Earns/hooks/useZapOutWidget'
import { FeeInfo, ParsedPosition, PositionStatus } from 'pages/Earns/types'
import { isForkFrom } from 'pages/Earns/utils'
import { getUnclaimedFeesInfo } from 'pages/Earns/utils/fees'
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
}: {
  positions: Array<ParsedPosition>
  feeInfoFromRpc: FeeInfoFromRpc[]
  setFeeInfoFromRpc: (feeInfo: FeeInfoFromRpc[]) => void
  onOpenZapInWidget: ({ pool, positionId }: ZapInInfo) => void
  onOpenZapOut: ({ position }: ZapOutInfo) => void
}) {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const theme = useTheme()
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const [positionThatClaimingFees, setPositionThatClaimingFees] = useState<ParsedPosition | null>(null)
  const [positionThatClaimingRewards, setPositionThatClaimingRewards] = useState<ParsedPosition | null>(null)

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

  const { claimModal: claimRewardsModal, onOpenClaim: onOpenClaimRewards, claiming: rewardsClaiming } = useKemRewards()

  const { widget: zapMigrationWidget, handleOpenZapMigration } = useZapMigrationWidget()

  const handleFetchUnclaimedFee = useCallback(
    async (position: ParsedPosition | null) => {
      if (!position) return

      const feeFromRpc = await getUnclaimedFeesInfo(position)

      const { tokenId } = position
      const feeInfoToAdd = {
        ...feeFromRpc,
        id: tokenId,
        timeRemaining: 30,
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
    if (!position.pool.isFarming || rewardsClaiming || position.rewards.unclaimedUsdValue === 0) return
    setPositionThatClaimingRewards(position)
    onOpenClaimRewards(position.tokenId, position.chain.id)
  }

  const handleMigrateToKem = (e: React.MouseEvent, position: ParsedPosition) => {
    e.stopPropagation()
    e.preventDefault()

    if (!position.suggestionPool) return

    const tickLower = priceToClosestTick(
      position.priceRange.min.toString(),
      position.token0.decimals,
      position.token1.decimals,
    )
    const tickUpper = priceToClosestTick(
      position.priceRange.max.toString(),
      position.token0.decimals,
      position.token1.decimals,
    )

    handleOpenZapMigration({
      chainId: position.chain.id,
      from: {
        dex: position.dex.id,
        poolId: position.pool.address,
        positionId: position.tokenId,
      },
      to: {
        dex: position.suggestionPool?.poolExchange as Exchange,
        poolId: position.suggestionPool?.address || '',
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

  return (
    <>
      {claimFeesModal}
      {claimRewardsModal}
      {zapMigrationWidget}

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
              } = position
              const feesClaimDisabled =
                !DEXES_SUPPORT_COLLECT_FEE[dex.id as EarnDex] || unclaimedFees === 0 || feesClaiming
              const rewardsClaimDisabled =
                !position.pool.isFarming || rewardsClaiming || position.rewards.claimableUsdValue === 0

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
                        <TokenLogo src={token1.logo} />
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
                    </Flex>
                  </PositionOverview>

                  {/* Actions for Tablet */}
                  {upToLarge && <PositionActionWrapper>{actions}</PositionActionWrapper>}

                  {/* Value info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`Value`}</PositionValueLabel>
                    <MouseoverTooltipDesktopOnly
                      text={
                        <>
                          {position.totalValueTokens.map(token => (
                            <Text key={token.address}>
                              {formatDisplayNumber(token.amount, { significantDigits: 4 })} {token.symbol}
                            </Text>
                          ))}
                        </>
                      }
                      width="fit-content"
                      placement="bottom"
                    >
                      <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '100px' }}>
                        {formatDisplayNumber(totalValue, {
                          style: 'currency',
                          significantDigits: 4,
                        })}
                      </Text>
                    </MouseoverTooltipDesktopOnly>
                  </PositionValueWrapper>

                  {/* APR info */}
                  <PositionValueWrapper>
                    <PositionValueLabel>{t`APR`}</PositionValueLabel>
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

                      {!!position.suggestionPool && position.status !== PositionStatus.CLOSED && (
                        <MouseoverTooltipDesktopOnly
                          text={
                            <>
                              <Text>
                                {pool.fee === position.suggestionPool.feeTier
                                  ? t`Migrate to exact same pair and fee tier on Uniswap v4 hook to earn extra rewards from the
                              Kyberswap Liquidity Mining Program.`
                                  : t`We found a pool with the same pair having Liquidity Mining Program. Migrate to this pool on Uniswap v4 hook to start earning farming rewards.`}
                              </Text>
                              <Text
                                color={theme.primary}
                                sx={{ cursor: 'pointer' }}
                                onClick={e => handleMigrateToKem(e, position)}
                              >
                                {t`Migrate`} →
                              </Text>
                            </>
                          }
                          width="290px"
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
                  </PositionValueWrapper>

                  {/* Unclaimed fees info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Unclaimed Fee`}</PositionValueLabel>
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
                  </PositionValueWrapper>

                  {/* Unclaimed rewards info */}
                  <PositionValueWrapper align={!upToLarge ? 'center' : ''}>
                    <PositionValueLabel>{t`Unclaimed rewards`}</PositionValueLabel>
                    {position.pool.isFarming ? (
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
                    ) : (
                      '$0'
                    )}
                  </PositionValueWrapper>

                  {!upToLarge && <div />}

                  {/* Balance info */}
                  <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
                    <PositionValueLabel>{t`Balance`}</PositionValueLabel>
                    <Flex flexDirection={upToSmall ? 'row' : 'column'} sx={{ gap: 1.8 }}>
                      <Text>
                        {formatDisplayNumber(token0.totalProvide, { significantDigits: 4 })} {token0.symbol}
                      </Text>
                      {upToSmall && <Divider />}
                      <Text>
                        {formatDisplayNumber(token1.totalProvide, { significantDigits: 4 })} {token1.symbol}
                      </Text>
                    </Flex>
                  </PositionValueWrapper>

                  {/* Price range info */}
                  <PositionValueWrapper align={upToLarge ? 'flex-end' : ''}>
                    <PriceRange
                      minPrice={priceRange.min}
                      maxPrice={priceRange.max}
                      currentPrice={priceRange.current}
                      tickSpacing={pool.tickSpacing}
                      token0Decimals={token0.decimals}
                      token1Decimals={token1.decimals}
                      dex={dex.id as EarnDex}
                    />
                  </PositionValueWrapper>

                  {/* Actions info */}
                  {!upToLarge && <PositionValueWrapper align="flex-end">{actions}</PositionValueWrapper>}
                </PositionRow>
              )
            })
          : emptyPosition}
      </PositionTableBody>
    </>
  )
}
