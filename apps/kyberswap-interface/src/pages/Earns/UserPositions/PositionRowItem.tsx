import { formatAprNumber } from '@kyber/utils/dist/number'
import { t } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ArrowRightCircle } from 'react-feather'
import { useNavigate } from 'react-router-dom'

import { ReactComponent as ListSmartExitIcon } from 'assets/svg/earn/ic_list_smart_exit.svg'
import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { InfoHelperWithDelay } from 'components/InfoHelper'
import { Loader2 } from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { PAIR_CATEGORY } from 'constants/trade'
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
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

function TruncatedBadge({
  dexName,
  dexLogo,
  fee,
  tokenId,
  isUniv2,
}: {
  dexName: string
  dexLogo: string
  fee: number
  tokenId: string | number
  isUniv2: boolean
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
      <Badge className="max-w-[300px] bg-white-08">
        <div className="flex items-center gap-1 overflow-hidden">
          <TokenLogo src={dexLogo} size={12} />
          <span ref={textRef} className="truncate text-[12px] text-subText">
            {label}
          </span>
        </div>
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
        <div className="flex flex-wrap items-center gap-2">
          <ImageContainer>
            <TokenLogo src={token0.logo} />
            <TokenLogo src={token1.logo} translateLeft />
            <TokenLogo src={chain.logo} size={12} translateLeft translateTop />
          </ImageContainer>
          <span className={cn('-ml-2 max-w-[160px] truncate', upToSmall ? 'text-[15px]' : 'text-[16px]')}>
            {token0.symbol}/{token1.symbol}
          </span>
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
                    <div className="flex flex-col gap-1">
                      <p>{t`The position is inactive. Update to an action price range to earn fees/rewards.`}</p>
                      <div
                        className="flex cursor-pointer items-center gap-1 text-primary"
                        onClick={e => onReposition(e, position)}
                      >
                        <span>{t`Reposition to new range`}</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  }
                  className="ml-1 text-warning"
                  placement="top"
                  width="280px"
                />
              ) : null}
            </Badge>
          )}
          {smartExitPosIds.includes(position.positionId) && (
            <MouseoverTooltipDesktopOnly text={t`Active Smart Exit Order`} width="fit-content" placement="bottom">
              <div
                className="flex size-6 cursor-pointer items-center justify-center rounded-[30px] bg-white/[0.04]"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  e.preventDefault()
                  navigate(APP_PATHS.EARN_SMART_EXIT)
                }}
              >
                <ListSmartExitIcon width={16} height={16} className="text-primary" />
              </div>
            </MouseoverTooltipDesktopOnly>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <TruncatedBadge
            dexName={dex.name}
            dexLogo={dex.logo}
            fee={pool.fee}
            tokenId={tokenId}
            isUniv2={pool.isUniv2}
          />
        </div>
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
                <p key={`${token.address}-${token.symbol}`}>
                  {formatDisplayNumber(token.amount, { significantDigits: 4 })} {token.symbol}
                </p>
              ))}
              {merklRewards.map(token => (
                <p key={`${token.address}-${token.symbol}`}>
                  {formatDisplayNumber(token.claimableAmount, { significantDigits: 4 })} {token.symbol}
                </p>
              ))}
            </>
          }
          width="fit-content"
          placement="bottom"
        >
          <div className="flex items-center gap-1.5">
            <p className="max-w-[80px]" style={LIMIT_TEXT_STYLES}>
              <AnimatedNumber
                value={formatDisplayNumber(totalValue + merklRewardsTotalUsd, {
                  style: 'currency',
                  significantDigits: 4,
                })}
              />
            </p>
            {position.isValueUpdating && (
              <MouseoverTooltipDesktopOnly text={t`Value is updating`} placement="top" width="fit-content">
                <Loader2 size={12} />
              </MouseoverTooltipDesktopOnly>
            )}
          </div>
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
          <div className="flex items-center gap-1">
            {pool.isFarming || bonusApr > 0 ? (
              <AprDetailTooltip
                feeApr={position.feeApr['24h']}
                egApr={position.kemEGApr['24h']}
                lmApr={position.kemLMApr['24h']}
                merklApr={bonusApr}
              >
                <span className="text-primary">
                  <AnimatedNumber value={`${formatAprNumber(apr['24h'] + bonusApr)}%`} />
                </span>
              </AprDetailTooltip>
            ) : (
              <span className="text-text">
                <AnimatedNumber value={`${formatAprNumber(apr['24h'])}%`} />
              </span>
            )}

            {!pool.isFarming &&
              (!!position.suggestionPool || (isStablePair && farmingPoolsByChain[chain.id]?.pools.length > 0)) &&
              position.status !== PositionStatus.CLOSED && (
                <MouseoverTooltipDesktopOnly
                  text={
                    <>
                      <p>
                        {!!position.suggestionPool
                          ? pool.fee === position.suggestionPool.feeTier
                            ? t`Earn extra rewards with exact same pair and fee tier on ${suggestedProtocolName} hook.`
                            : t`We found a pool with the same pair offering extra rewards. Migrate to this pool on ${suggestedProtocolName} hook to start earning farming rewards.`
                          : t`We found other stable pools offering extra rewards. Explore and migrate to start earning.`}
                      </p>
                      <p className="cursor-pointer text-primary" onClick={e => onMigrateToKem(e, position)}>
                        {!!position.suggestionPool ? t`Migrate` : t`View Pools`} →
                      </p>
                    </>
                  }
                  width={!!position.suggestionPool ? '290px' : '310px'}
                  placement="bottom"
                >
                  <ArrowRightCircle size={16} className="text-primary" onClick={e => onMigrateToKem(e, position)} />
                </MouseoverTooltipDesktopOnly>
              )}
          </div>
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
                <p>
                  {formatDisplayNumber(token0.unclaimedAmount, { significantDigits: 6 })}{' '}
                  {token0.isNative ? pool.nativeToken.symbol : token0.symbol}
                </p>
                <p>
                  {formatDisplayNumber(token1.unclaimedAmount, { significantDigits: 6 })}{' '}
                  {token1.isNative ? pool.nativeToken.symbol : token1.symbol}
                </p>
              </>
            }
            width="fit-content"
            placement="bottom"
          >
            <p className="max-w-[100px]" style={LIMIT_TEXT_STYLES}>
              <AnimatedNumber value={formatDisplayNumber(unclaimedFees, { style: 'currency', significantDigits: 4 })} />
            </p>
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
          <div className="flex items-center gap-1">
            {upToSmall && <FarmingIcon width={20} height={20} />}
            <MouseoverTooltipDesktopOnly
              text={
                <>
                  <p>
                    {t`In-Progress`}:{' '}
                    {formatDisplayNumber(rewards.inProgressUsdValue, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </p>
                  <p>
                    {t`Claimable`}:{' '}
                    {formatDisplayNumber(rewards.claimableUsdValue, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  </p>
                  {merklRewardsTotalUsd > 0 && (
                    <p>
                      {t`Merkl Bonus`}:{' '}
                      {formatDisplayNumber(merklRewardsTotalUsd, {
                        significantDigits: 4,
                        style: 'currency',
                      })}
                    </p>
                  )}
                </>
              }
              width="fit-content"
              placement="bottom"
            >
              <span>
                <AnimatedNumber
                  value={formatDisplayNumber(rewards.unclaimedUsdValue + merklRewardsTotalUsd, {
                    style: 'currency',
                    significantDigits: 4,
                  })}
                />
              </span>
            </MouseoverTooltipDesktopOnly>
          </div>
        )}
      </PositionValueWrapper>

      {!upToCustomLarge && <div />}

      {/* Balance info */}
      <PositionValueWrapper align={upToSmall ? 'flex-end' : ''}>
        <PositionValueLabel>{t`Balance`}</PositionValueLabel>

        {token0.symbol && token1.symbol ? (
          <div
            className={cn(
              'flex w-full gap-[7.2px] overflow-hidden',
              upToSmall ? 'flex-row items-center' : 'flex-col items-start',
            )}
          >
            <div className="flex max-w-full items-center gap-1">
              <span className="flex-shrink-0 whitespace-nowrap">
                {formatDisplayNumber(token0.currentAmount, { significantDigits: 4 })}
              </span>
              <span className="max-w-[80px]" style={LIMIT_TEXT_STYLES}>
                {token0.symbol}
              </span>
            </div>
            {upToSmall && <Divider />}
            <div className="flex max-w-full items-center gap-1">
              <span className="flex-shrink-0 whitespace-nowrap">
                {formatDisplayNumber(token1.currentAmount, { significantDigits: 4 })}
              </span>
              <span className="max-w-[80px]" style={LIMIT_TEXT_STYLES}>
                {token1.symbol}
              </span>
            </div>
          </div>
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
