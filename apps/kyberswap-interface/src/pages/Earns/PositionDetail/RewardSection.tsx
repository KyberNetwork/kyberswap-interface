import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Clock } from 'react-feather'
import { useCycleConfigQuery } from 'services/kyberdata'

import { ReactComponent as FarmingIcon } from 'assets/svg/kyber/kem.svg'
import { ReactComponent as UniBonusIcon } from 'assets/svg/kyber/uni_bonus.svg'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { usePositionDetailContext } from 'pages/Earns/PositionDetail/PositionDetailContext'
import { CardDivider, ClaimButton, DarkCard, NextDistribution, RewardLink } from 'pages/Earns/PositionDetail/styles'
import { HorizontalDivider } from 'pages/Earns/UserPositions/styles'
import AnimatedNumber from 'pages/Earns/components/AnimatedNumber'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import useMerklRewards from 'pages/Earns/hooks/useMerklRewards'
import { PositionStatus, TokenRewardInfo } from 'pages/Earns/types'
import { formatDisplayNumber } from 'utils/numbers'

const formatTimeRemaining = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

const CycleCountdown = ({ endTime, textColor }: { endTime: number; textColor: string }) => {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = Math.max(0, endTime - now)
      setTimeRemaining(formatTimeRemaining(remaining))
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return (
    <div className="flex items-center gap-1">
      <Clock size={16} color={textColor} />
      <span className="text-sm" style={{ color: textColor }}>
        {timeRemaining}
      </span>
    </div>
  )
}

const RewardSection = ({ hasFarmingReward }: { hasFarmingReward: boolean }) => {
  const { position, initialLoading, shareBtn, refetchPositions, isWaitingForRewards } = usePositionDetailContext()
  const theme = useTheme()

  const {
    rewardInfo,
    claimModal: claimRewardsModal,
    onOpenClaim: onOpenClaimRewards,
    pendingClaimKeys: pendingRewardClaimKeys,
  } = useKemRewards({ refetchAfterCollect: refetchPositions })

  const { rewardsByPosition } = useMerklRewards({ positions: position ? [position] : undefined })
  const merklPositionRewards = position ? rewardsByPosition[position.positionId] : undefined
  const merklRewards = merklPositionRewards?.rewards || []
  const merklClaimableUsd = merklPositionRewards?.totalUsdValue || 0
  const merklClaimedUsd = merklPositionRewards?.claimedUsdValue || 0

  const rewardInfoThisPosition = rewardInfo?.nfts.find(item => item.nftId === position?.tokenId.toString())

  const chain = position?.chain.id ? NETWORKS_INFO[position.chain.id as ChainId]?.route || '' : ''
  const { data: cycleConfig } = useCycleConfigQuery(
    { poolAddress: position?.pool.address || '', chain: chain },
    { skip: !position?.pool.address || !chain },
  )

  const isUnfinalized = position?.isUnfinalized
  const claimKey = position ? `${position.chain.id}:${position.tokenId}` : ''
  const isRewardsClaiming = claimKey ? pendingRewardClaimKeys.includes(claimKey) : false

  return (
    <>
      {claimRewardsModal}

      <DarkCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasFarmingReward && <FarmingIcon width={20} height={20} />}
            {merklRewards.length > 0 && (
              <MouseoverTooltip text={merklRewardTooltip(merklRewards, theme.text)} placement="top" width="160px">
                <UniBonusIcon width={20} height={20} />
              </MouseoverTooltip>
            )}
            <span className="text-base uppercase text-subText">{t`Total Reward`}</span>
            {!initialLoading && !isUnfinalized && position?.status !== PositionStatus.CLOSED && shareBtn()}
          </div>

          <div className="flex items-center gap-1">
            {initialLoading ? (
              <PositionSkeleton width={100} height={24} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={100} height={24} text={t`Finalizing...`} />
            ) : (
              <>
                <span className="text-xl font-medium text-text">
                  <AnimatedNumber
                    value={formatDisplayNumber(
                      (rewardInfoThisPosition?.totalUsdValue || 0) + merklClaimedUsd + merklClaimableUsd,
                      {
                        significantDigits: 4,
                        style: 'currency',
                      },
                    )}
                  />
                </span>
                <InfoHelper
                  text={totalRewardTooltip({
                    lmTokens: rewardInfoThisPosition?.lmTokens || [],
                    egTokens: rewardInfoThisPosition?.egTokens || [],
                    merklRewards,
                    textColor: theme.text,
                  })}
                  placement="top"
                  width="160px"
                  size={14}
                />
              </>
            )}
          </div>
        </div>

        <CardDivider />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-subText">{t`Claimed`}</span>
            {initialLoading ? (
              <PositionSkeleton width={80} height={24} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={80} height={24} text={t`Finalizing...`} />
            ) : (
              <span className="text-xl text-text">
                <AnimatedNumber
                  value={formatDisplayNumber((rewardInfoThisPosition?.claimedUsdValue || 0) + merklClaimedUsd, {
                    significantDigits: 4,
                    style: 'currency',
                  })}
                />
              </span>
            )}
          </div>

          {hasFarmingReward && (
            <div className="flex w-full items-center justify-between px-4">
              <span className="text-sm text-subText">{t`In-Progress`}</span>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={80} height={24} text={t`Finalizing...`} />
              ) : isWaitingForRewards ? (
                <RewardSyncing width={80} height={24} />
              ) : (
                <div className="flex items-center">
                  <span className="text-xl text-text">
                    <AnimatedNumber
                      value={formatDisplayNumber(rewardInfoThisPosition?.inProgressUsdValue || 0, {
                        significantDigits: 4,
                        style: 'currency',
                      })}
                    />
                  </span>
                  <InfoHelper
                    text={inProgressRewardTooltip({
                      pendingUsdValue: rewardInfoThisPosition?.pendingUsdValue || 0,
                      vestingUsdValue: rewardInfoThisPosition?.vestingUsdValue || 0,
                      waitingUsdValue: rewardInfoThisPosition?.waitingUsdValue || 0,
                      tokens: rewardInfoThisPosition?.tokens || [],
                    })}
                    width="290px"
                    placement="top"
                  />
                </div>
              )}
            </div>
          )}

          {hasFarmingReward && !!cycleConfig && (
            <NextDistribution>
              <div className="flex items-center">
                <span className="text-sm text-subText">{t`Cycle ends in`}</span>
                <InfoHelper placement="top" width="fit-content" text={t`Rewards are distributed every 7 days`} />
              </div>

              {initialLoading || !cycleConfig ? (
                <PositionSkeleton width={112} height={16} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={112} height={16} text={t`Finalizing...`} />
              ) : (
                <CycleCountdown endTime={cycleConfig.endTime} textColor={theme.subText} />
              )}
            </NextDistribution>
          )}

          <div className="flex flex-col items-end gap-2">
            <div className="flex w-full items-center justify-between px-4">
              <span className="text-sm text-subText">{t`Claimable`}</span>
              {initialLoading ? (
                <PositionSkeleton width={80} height={24} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={80} height={24} text={t`Finalizing...`} />
              ) : isWaitingForRewards ? (
                <RewardSyncing width={80} height={24} />
              ) : (
                <span className="text-xl text-text">
                  <AnimatedNumber
                    value={formatDisplayNumber((rewardInfoThisPosition?.claimableUsdValue || 0) + merklClaimableUsd, {
                      significantDigits: 4,
                      style: 'currency',
                    })}
                  />
                </span>
              )}
            </div>

            {hasFarmingReward && (
              <ClaimButton
                disabled={
                  !position ||
                  initialLoading ||
                  isUnfinalized ||
                  !rewardInfoThisPosition?.claimableUsdValue ||
                  isRewardsClaiming
                }
                onClick={() => position && onOpenClaimRewards(position)}
              >
                {isRewardsClaiming ? (
                  <div className="flex items-center gap-1">
                    <Loader size="12px" />
                    {t`Claiming`}
                  </div>
                ) : (
                  t`Claim`
                )}
              </ClaimButton>
            )}
          </div>
        </div>
      </DarkCard>
    </>
  )
}

export const inProgressRewardTooltip = ({
  pendingUsdValue,
  vestingUsdValue,
  waitingUsdValue,
  tokens,
}: {
  pendingUsdValue: number
  vestingUsdValue: number
  waitingUsdValue: number
  tokens: Array<TokenRewardInfo>
}) => {
  const pendingTokens =
    pendingUsdValue === 0
      ? ''
      : '(' +
        tokens
          .filter(token => token.pendingAmount > 0)
          .map(token => `${formatDisplayNumber(token.pendingAmount, { significantDigits: 4 })} ${token.symbol}`)
          .join(' + ') +
        ') '

  const vestingTokens =
    vestingUsdValue === 0
      ? ''
      : '(' +
        tokens
          .filter(token => token.vestingAmount > 0)
          .map(token => `${formatDisplayNumber(token.vestingAmount, { significantDigits: 4 })} ${token.symbol}`)
          .join(' + ') +
        ') '

  const waitingTokens =
    waitingUsdValue === 0
      ? ''
      : '(' +
        tokens
          .filter(token => token.waitingAmount > 0)
          .map(token => `${formatDisplayNumber(token.waitingAmount, { significantDigits: 4 })} ${token.symbol}`)
          .join(' + ') +
        ') '

  return (
    <ul className="my-1 pl-5">
      <li>
        {t`Current Cycle`}:{' '}
        <b>
          {formatDisplayNumber(pendingUsdValue, {
            significantDigits: 4,
            style: 'currency',
          })}
        </b>{' '}
        {pendingTokens}
        {t`will move to "Vesting" when this cycle ends.`}
      </li>
      <li className="mt-1">
        {t`Vesting`}:{' '}
        <b>
          {formatDisplayNumber(vestingUsdValue, {
            significantDigits: 4,
            style: 'currency',
          })}
        </b>{' '}
        {vestingTokens}
        {t`in a 2-day finalization period before they become claimable.`}
      </li>
      {waitingUsdValue > 0 ? (
        <li className="mt-1">
          {t`Pending`}:{' '}
          <b>
            {formatDisplayNumber(waitingUsdValue, {
              significantDigits: 4,
              style: 'currency',
            })}
          </b>{' '}
          {waitingTokens}
          {t`are under review after failing to finalize in the 2 days vesting period.`}
        </li>
      ) : null}
    </ul>
  )
}

const merklRewardTooltip = (merklRewards: Array<TokenRewardInfo>, textColor: string) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs leading-4">{t`Merkl Bonus:`}</span>
    {merklRewards.map(token => (
      <div className="flex flex-wrap items-center gap-1" key={`${token.address}-${token.symbol}`}>
        <TokenLogo src={token.logo} size={16} />
        <RewardLink href="https://app.merkl.xyz/users" target="_blank">
          <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
          <span style={{ color: textColor }}>{token.symbol}</span>
        </RewardLink>
      </div>
    ))}
  </div>
)

export const totalRewardTooltip = ({
  lmTokens,
  egTokens,
  merklRewards,
  textColor,
}: {
  lmTokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  merklRewards?: Array<TokenRewardInfo>
  textColor: string
}) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs leading-4">
      {t`LM Reward:`}
      {!lmTokens.length ? ' 0' : ''}
    </span>
    {lmTokens.map(token => (
      <div className="flex flex-wrap items-center gap-1" key={`${token.address}-${token.symbol}`}>
        <TokenLogo src={token.logo} size={16} />
        <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
        <span style={{ color: textColor }}>{token.symbol}</span>
      </div>
    ))}

    <HorizontalDivider />
    <span className="text-xs leading-4">
      {t`EG Sharing Reward:`}
      {!egTokens.length ? ' 0' : ''}
    </span>
    {egTokens.map(token => (
      <div className="flex flex-wrap items-center gap-1" key={`${token.address}-${token.symbol}`}>
        <TokenLogo src={token.logo} size={16} />
        <span style={{ color: textColor }}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</span>
        <span style={{ color: textColor }}>{token.symbol}</span>
      </div>
    ))}

    {!!merklRewards?.length && (
      <>
        <HorizontalDivider />
        {merklRewardTooltip(merklRewards, textColor)}
      </>
    )}
  </div>
)

export default RewardSection
