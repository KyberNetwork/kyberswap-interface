import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowRightCircle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as ListSmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import { Loader2 } from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS, PAIR_CATEGORY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import DropdownAction from 'pages/Earns/UserPositions/DropdownAction'
import PriceRange from 'pages/Earns/UserPositions/PriceRange'
import {
  Badge,
  BadgeType,
  Divider,
  ImageContainer,
  PositionActionWrapper,
  PositionOverview,
  PositionRow,
  PositionValueLabel,
  PositionValueWrapper,
} from 'pages/Earns/UserPositions/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import AprDetailTooltip from 'pages/Earns/components/AprDetailTooltip'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import { EARN_DEXES, LIMIT_TEXT_STYLES } from 'pages/Earns/constants'
import { EarnPool, ParsedPosition, PositionStatus, TokenRewardInfo } from 'pages/Earns/types'
import { checkEarlyPosition } from 'pages/Earns/utils/position'
import { formatDisplayNumber } from 'utils/numbers'

function TruncatedBadge({
  dexName,
  dexLogo,
  fee,
  tokenId,
  isUniv2,
  theme,
}: {
  dexName: string
  dexLogo: string
  fee: number
  tokenId: string | number
  isUniv2: boolean
  theme: ReturnType<typeof useTheme>
}) {
  const textRef = useRef<HTMLDivElement>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const el = textRef.current
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth)
    }
  }, [dexName, fee, tokenId, isUniv2])

  const label = `${dexName} | ${formatDisplayNumber(fee, { significantDigits: 4 })}%${!isUniv2 ? ` | #${tokenId}` : ''}`

  return (
    <MouseoverTooltipDesktopOnly text={label} width="fit-content" placement="bottom" disableTooltip={!isTruncated}>
      <Badge
        style={{
          backgroundColor: rgba(theme.white, 0.08),
          maxWidth: '300px',
        }}
      >
        <Flex alignItems={'center'} sx={{ gap: '4px' }} style={{ overflow: 'hidden' }}>
          <TokenLogo src={dexLogo} size={12} />
          <Text
            ref={textRef}
            fontSize={12}
            color={theme.subText}
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {label}
          </Text>
        </Flex>
      </Badge>
    </MouseoverTooltipDesktopOnly>
  )
}

export interface PositionRowItemProps {
  position: ParsedPosition
  index: number
  smartExitPosIds: string[]
  pendingFeeClaimKeys: string[]
  pendingRewardClaimKeys: string[]
  rewardsByPosition: Record<string, { rewards: TokenRewardInfo[]; totalUsdValue: number }> | undefined
  farmingPoolsByChain: Record<number, { pools: EarnPool[] }>
  upToCustomLarge: boolean
  upToSmall: boolean
  onOpenIncreaseLiquidity: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenZapOut: (e: React.MouseEvent, position: ParsedPosition) => void
  onClaimFees: (e: React.MouseEvent, position: ParsedPosition) => void
  onClaimRewards: (e: React.MouseEvent, position: ParsedPosition) => void
  onReposition: (e: React.MouseEvent, position: ParsedPosition) => void
  onMigrateToKem: (e: React.MouseEvent, position: ParsedPosition) => void
  onOpenSmartExit: (position: ParsedPosition) => void
}

export default function PositionRowItem({
  position,
  index,
  smartExitPosIds,
  pendingFeeClaimKeys,
  pendingRewardClaimKeys,
  rewardsByPosition,
  farmingPoolsByChain,
  upToCustomLarge,
  upToSmall,
  onOpenIncreaseLiquidity,
  onOpenZapOut,
  onClaimFees,
  onClaimRewards,
  onReposition,
  onMigrateToKem,
  onOpenSmartExit,
}: PositionRowItemProps) {
  const theme = useTheme()
  const navigate = useNavigate()

  const {
    positionId,
    tokenId,
    token0,
    token1,
    pool,
    dex,
    chain,
    totalValue,
    priceRange,
    apr,
    bonusApr,
    unclaimedFees,
    status,
    rewards,
    isUnfinalized,
  } = position

  const claimKey = `${chain.id}:${tokenId}`
  const isFeeClaiming = pendingFeeClaimKeys.includes(claimKey)
  const isRewardClaiming = pendingRewardClaimKeys.includes(claimKey)
  const feesClaimDisabled = !EARN_DEXES[dex.id].collectFeeSupported || unclaimedFees === 0 || isFeeClaiming
  const rewardsClaimDisabled = position.rewards.claimableUsdValue === 0 || isRewardClaiming
  const isStablePair = pool.category === PAIR_CATEGORY.STABLE
  const isEarlyPosition = checkEarlyPosition(position)
  const isWaitingForRewards = pool.isFarming && rewards.totalUsdValue === 0 && isEarlyPosition
  const merklRewards = rewardsByPosition?.[positionId]?.rewards || []
  const merklRewardsTotalUsd = rewardsByPosition?.[positionId]?.totalUsdValue || 0
  const suggestedProtocolName = position.suggestionPool
    ? EARN_DEXES[position.suggestionPool.exchange].name.replace('FairFlow', '').trim()
    : ''

  const actions = (
    <DropdownAction
      position={position}
      hasActiveSmartExitOrder={smartExitPosIds.includes(position.positionId)}
      onOpenIncreaseLiquidityWidget={onOpenIncreaseLiquidity}
      onOpenZapOut={onOpenZapOut}
      onOpenSmartExit={(_e: React.MouseEvent, pos: ParsedPosition) => {
        onOpenSmartExit(pos)
      }}
      onOpenReposition={onReposition}
      claimFees={{
        onClaimFee: onClaimFees,
        feesClaimDisabled,
        feesClaiming: isFeeClaiming,
      }}
      claimRewards={{
        onClaimRewards: onClaimRewards,
        rewardsClaimDisabled,
        rewardsClaiming: isRewardClaiming,
      }}
    />
  )

  return (
    <PositionRow
      to={APP_PATHS.EARN_POSITION_DETAIL.replace(':positionId', !pool.isUniv2 ? positionId : pool.address)
        .replace(':chainId', chain.id.toString())
        .replace(':exchange', dex.id)}
      $isUnfinalized={isUnfinalized}
      $index={index}
    >
      {/* Overview info */}
      <PositionOverview>
        <Flex alignItems={'center'} sx={{ gap: 2 }} flexWrap={'wrap'}>
          <ImageContainer>
            <TokenLogo src={token0.logo} />
            <TokenLogo src={token1.logo} translateLeft />
            <TokenLogo src={chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <Text
            marginLeft={-2}
            fontSize={upToSmall ? 15 : 16}
            maxWidth={'160px'}
            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {token0.symbol}/{token1.symbol}
          </Text>
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
              {status === PositionStatus.OUT_RANGE ? (
                <InfoHelperWithDelay
                  text={
                    <Flex flexDirection={'column'} sx={{ gap: 1 }}>
                      <Text>{t`The position is inactive. Update to an action price range to earn fees/rewards.`}</Text>
                      <Flex
                        color={theme.primary}
                        alignItems={'center'}
                        sx={{ gap: 1, cursor: 'pointer' }}
                        onClick={e => onReposition(e, position)}
                      >
                        <Text>{t`Reposition to new range`}</Text>
                        <ArrowRight size={14} />
                      </Flex>
                    </Flex>
                  }
                  color={theme.warning}
                  placement="top"
                  width="280px"
                  style={{ marginLeft: 4 }}
                />
              ) : null}
            </Badge>
          )}
          {smartExitPosIds.includes(position.positionId) && (
            <MouseoverTooltipDesktopOnly text={t`Active Smart Exit Order`} width="fit-content" placement="bottom">
              <Flex
                alignItems="center"
                justifyContent="center"
                sx={{ cursor: 'pointer', borderRadius: '30px' }}
                backgroundColor={rgba(theme.white, 0.04)}
                width={24}
                height={24}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  navigate(APP_PATHS.EARN_SMART_EXIT)
                }}
              >
                <ListSmartExitIcon width={16} height={16} color={theme.primary} />
              </Flex>
            </MouseoverTooltipDesktopOnly>
          )}
        </Flex>
        <Flex flexWrap={'wrap'} alignItems={'center'} sx={{ gap: '6px' }}>
          <TruncatedBadge
            dexName={dex.name}
            dexLogo={dex.logo}
            fee={pool.fee}
            tokenId={tokenId}
            isUniv2={pool.isUniv2}
            theme={theme}
          />
        </Flex>
      </PositionOverview>

      {/* Actions for Tablet */}
      {upToCustomLarge && (!isUnfinalized ? <PositionActionWrapper>{actions}</PositionActionWrapper> : <div />)}

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
              {merklRewards.map(token => (
                <Text key={`${token.address}-${token.symbol}`}>
                  {formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} {token.symbol}
                </Text>
              ))}
            </>
          }
          width="fit-content"
          placement="bottom"
        >
          <Flex alignItems={'center'} sx={{ gap: '6px' }}>
            <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '80px' }}>
              <AnimatedNumber
                value={formatDisplayNumber(totalValue + merklRewardsTotalUsd, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              />
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
          <PositionSkeleton width={80} height={19} text={t`Finalizing...`} />
        ) : isWaitingForRewards ? (
          <RewardSyncing width={70} height={19} />
        ) : (
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            {pool.isFarming || bonusApr > 0 ? (
              <AprDetailTooltip
                feeApr={position.feeApr['24h']}
                egApr={position.kemEGApr['24h']}
                lmApr={position.kemLMApr['24h']}
                uniApr={bonusApr}
              >
                <Text color={theme.primary}>
                  <AnimatedNumber value={`${formatAprNumber(apr['24h'] + bonusApr)}%`} />
                </Text>
              </AprDetailTooltip>
            ) : (
              <Text color={theme.text}>
                <AnimatedNumber value={`${formatAprNumber(apr['24h'])}%`} />
              </Text>
            )}

            {!pool.isFarming &&
              (!!position.suggestionPool || (isStablePair && farmingPoolsByChain[chain.id]?.pools.length > 0)) &&
              position.status !== PositionStatus.CLOSED && (
                <MouseoverTooltipDesktopOnly
                  text={
                    <>
                      <Text>
                        {!!position.suggestionPool
                          ? pool.fee === position.suggestionPool.feeTier
                            ? t`Earn extra rewards with exact same pair and fee tier on ${suggestedProtocolName} hook.`
                            : t`We found a pool with the same pair offering extra rewards. Migrate to this pool on ${suggestedProtocolName} hook to start earning farming rewards.`
                          : t`We found other stable pools offering extra rewards. Explore and migrate to start earning.`}
                      </Text>
                      <Text color={theme.primary} sx={{ cursor: 'pointer' }} onClick={e => onMigrateToKem(e, position)}>
                        {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                      </Text>
                    </>
                  }
                  width={!!position.suggestionPool ? '290px' : '310px'}
                  placement="bottom"
                >
                  <ArrowRightCircle size={16} color={theme.primary} onClick={e => onMigrateToKem(e, position)} />
                </MouseoverTooltipDesktopOnly>
              )}
          </Flex>
        )}
      </PositionValueWrapper>

      {/* Unclaimed fees info */}
      <PositionValueWrapper align={upToCustomLarge ? 'flex-end' : ''}>
        <PositionValueLabel>{t`Unclaimed fees`}</PositionValueLabel>

        {isUnfinalized ? (
          <PositionSkeleton width={80} height={19} text={t`Finalizing...`} />
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
              <AnimatedNumber value={formatDisplayNumber(unclaimedFees, { style: 'currency', significantDigits: 4 })} />
            </Text>
          </MouseoverTooltipDesktopOnly>
        )}
      </PositionValueWrapper>

      {/* Unclaimed rewards info */}
      <PositionValueWrapper align={!upToCustomLarge ? 'center' : ''}>
        <PositionValueLabel>{t`Unclaimed rewards`}</PositionValueLabel>
        {isUnfinalized ? (
          <PositionSkeleton width={80} height={19} text={t`Finalizing...`} />
        ) : isWaitingForRewards ? (
          <RewardSyncing width={80} height={19} />
        ) : (
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            {upToSmall && <FarmingIcon width={20} height={20} />}
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
                  {merklRewardsTotalUsd > 0 && (
                    <Text>
                      {t`Uniswap Bonus`}:{' '}
                      {formatDisplayNumber(merklRewardsTotalUsd, {
                        significantDigits: 4,
                        style: 'currency',
                      })}
                    </Text>
                  )}
                </>
              }
              width="fit-content"
              placement="bottom"
            >
              <Text>
                <AnimatedNumber
                  value={formatDisplayNumber(rewards.unclaimedUsdValue + merklRewardsTotalUsd, {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                />
              </Text>
            </MouseoverTooltipDesktopOnly>
          </Flex>
        )}
      </PositionValueWrapper>

      {!upToCustomLarge && <div />}

      {/* Balance info */}
      <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
        <PositionValueLabel>{t`Balance`}</PositionValueLabel>

        {token0.symbol && token1.symbol ? (
          <Flex
            flexDirection={upToSmall ? 'row' : 'column'}
            alignItems={upToSmall ? 'center' : 'flex-start'}
            sx={{ gap: 1.8, overflow: 'hidden', width: '100%' }}
          >
            <Flex alignItems="center" sx={{ gap: 1, maxWidth: '100%' }}>
              <Text style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatDisplayNumber(token0.currentAmount, { significantDigits: 4 })}
              </Text>
              <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '80px' }}>{token0.symbol}</Text>
            </Flex>
            {upToSmall && <Divider />}
            <Flex alignItems="center" sx={{ gap: 1, maxWidth: '100%' }}>
              <Text style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                {formatDisplayNumber(token1.currentAmount, { significantDigits: 4 })}
              </Text>
              <Text sx={{ ...LIMIT_TEXT_STYLES, maxWidth: '80px' }}>{token1.symbol}</Text>
            </Flex>
          </Flex>
        ) : (
          '--'
        )}
      </PositionValueWrapper>

      {/* Price range info */}
      <PositionValueWrapper align={upToCustomLarge ? 'flex-end' : ''}>
        {upToCustomLarge ? (
          isUnfinalized ? null : (
            <PriceRange
              minPrice={priceRange.min}
              maxPrice={priceRange.max}
              currentPrice={priceRange.current}
              tickSpacing={pool.tickSpacing}
              token0Decimals={token0.decimals}
              token1Decimals={token1.decimals}
              dex={dex.id}
            />
          )
        ) : isUnfinalized ? (
          <PositionSkeleton width={80} height={19} text={t`Finalizing...`} />
        ) : (
          <PriceRange
            minPrice={priceRange.min}
            maxPrice={priceRange.max}
            currentPrice={priceRange.current}
            tickSpacing={pool.tickSpacing}
            token0Decimals={token0.decimals}
            token1Decimals={token1.decimals}
            dex={dex.id}
          />
        )}
      </PositionValueWrapper>

      {/* Actions info */}
      {!upToCustomLarge && (
        <PositionValueWrapper align="flex-end">
          {isUnfinalized ? <PositionSkeleton width={80} height={19} text={t`Finalizing...`} /> : actions}
        </PositionValueWrapper>
      )}
    </PositionRow>
  )
}
