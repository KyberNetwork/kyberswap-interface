import { ShareType } from '@kyber/ui'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { Clock } from 'react-feather'
import { Flex, Text } from 'rebass'
import { useCycleConfigQuery } from 'services/kyberdata'

import { ReactComponent as KemIcon } from 'assets/svg/kyber/kem.svg'
import InfoHelper from 'components/InfoHelper'
import Loader from 'components/Loader'
import TokenLogo from 'components/TokenLogo'
import { NETWORKS_INFO } from 'constants/networks'
import useTheme from 'hooks/useTheme'
import { NextDistribution, PositionAction, RewardDetailInfo, RewardsSection } from 'pages/Earns/PositionDetail/styles'
import { HorizontalDivider } from 'pages/Earns/UserPositions/styles'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import RewardSyncing from 'pages/Earns/components/RewardSyncing'
import useKemRewards from 'pages/Earns/hooks/useKemRewards'
import { ParsedPosition, TokenRewardInfo } from 'pages/Earns/types'
import { checkEarlyPosition } from 'pages/Earns/utils/position'
import { formatDisplayNumber } from 'utils/numbers'

const formatTimeRemaining = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

const RewardSection = ({
  position,
  initialLoading,
  shareBtn,
  refetchPositions,
}: {
  position?: ParsedPosition
  initialLoading: boolean
  shareBtn: (type: ShareType) => React.ReactNode
  refetchPositions: () => void
}) => {
  const theme = useTheme()

  const [timeRemaining, setTimeRemaining] = useState('')

  const {
    rewardInfo,
    claimModal: claimRewardsModal,
    onOpenClaim: onOpenClaimRewards,
    claiming: rewardsClaiming,
  } = useKemRewards(refetchPositions)
  const rewardInfoThisPosition = !position ? undefined : rewardInfo?.nfts.find(item => item.nftId === position.tokenId)

  const chain = position?.chain.id ? NETWORKS_INFO[position.chain.id as ChainId]?.route || '' : ''
  const { data: cycleConfig } = useCycleConfigQuery(
    { poolAddress: position?.pool.address || '', chain: chain },
    { skip: !position?.pool.address || !chain },
  )

  const isUnfinalized = position?.isUnfinalized
  const isEarlyPosition = !!position && checkEarlyPosition(position)
  const isWaitingForRewards = position?.pool.isFarming && position.rewards.totalUsdValue === 0 && isEarlyPosition

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!cycleConfig) return
      const now = Math.floor(Date.now() / 1000)
      const remaining = cycleConfig.endTime - now
      setTimeRemaining(formatTimeRemaining(remaining))
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)
    return () => clearInterval(interval)
  }, [cycleConfig])

  return (
    <>
      {claimRewardsModal}

      <RewardsSection>
        <Flex alignItems={'center'} justifyContent={'space-between'} sx={{ gap: '20px' }}>
          <Flex alignItems={'center'} sx={{ gap: 1 }}>
            <KemIcon width={20} height={20} />
            <Text fontSize={14} color={theme.subText} lineHeight={'20PX'}>
              {t`Total Rewards`}
            </Text>
            {!initialLoading && !isUnfinalized && shareBtn(ShareType.POSITION_REWARDS_INFO)}
          </Flex>

          {initialLoading ? (
            <PositionSkeleton width={110} height={24} />
          ) : isUnfinalized ? (
            <PositionSkeleton width={110} height={24} text="Finalizing..." />
          ) : (
            <Flex alignItems={'center'} sx={{ gap: 1 }}>
              <Text fontSize={20}>
                {formatDisplayNumber(rewardInfoThisPosition?.totalUsdValue || 0, {
                  significantDigits: 4,
                  style: 'currency',
                })}
              </Text>
              <InfoHelper
                text={totalRewardTooltip({
                  lmTokens: rewardInfoThisPosition?.lmTokens || [],
                  egTokens: rewardInfoThisPosition?.egTokens || [],
                  textColor: theme.text,
                })}
                placement="top"
                width="160px"
                size={14}
              />
            </Flex>
          )}
        </Flex>

        <RewardDetailInfo>
          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            {initialLoading ? (
              <PositionSkeleton width={90} height={24} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={90} height={24} text="Finalizing..." />
            ) : (
              <Text fontSize={20}>
                {formatDisplayNumber(rewardInfoThisPosition?.claimedUsdValue || 0, {
                  significantDigits: 4,
                  style: 'currency',
                })}
              </Text>
            )}
            <Text fontSize={14} color={theme.subText}>
              {t`Claimed`}
            </Text>
          </Flex>

          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            {initialLoading ? (
              <PositionSkeleton width={105} height={24} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={105} height={24} text="Finalizing..." />
            ) : isWaitingForRewards ? (
              <RewardSyncing />
            ) : (
              <Flex alignItems={'center'}>
                <Text fontSize={20}>
                  {formatDisplayNumber(rewardInfoThisPosition?.inProgressUsdValue || 0, {
                    significantDigits: 4,
                    style: 'currency',
                  })}
                </Text>
                <InfoHelper
                  text={inProgressRewardTooltip({
                    pendingUsdValue: rewardInfoThisPosition?.pendingUsdValue || 0,
                    vestingUsdValue: rewardInfoThisPosition?.vestingUsdValue || 0,
                    tokens: rewardInfoThisPosition?.tokens || [],
                  })}
                  width="290px"
                  placement="top"
                  color={theme.text}
                />
              </Flex>
            )}
            <Text fontSize={14} color={theme.subText}>
              {t`In-Progress`}
            </Text>
          </Flex>

          {!!cycleConfig && (
            <NextDistribution>
              <Flex alignItems={'center'}>
                <Text fontSize={14} color={theme.subText}>
                  {t`Cycle ends in`}
                </Text>
                <InfoHelper placement="top" width="fit-content" text={t`Rewards are distributed every 7 days`} />
              </Flex>

              {initialLoading || !cycleConfig ? (
                <PositionSkeleton width={112} height={16} />
              ) : isUnfinalized ? (
                <PositionSkeleton width={112} height={16} text="Finalizing..." />
              ) : (
                <Flex alignItems={'center'} sx={{ gap: 1 }}>
                  <Clock size={16} color={theme.subText} />
                  <Text fontSize={14} color={theme.subText}>
                    {timeRemaining}
                  </Text>
                </Flex>
              )}
            </NextDistribution>
          )}

          <Flex width={'100%'} alignItems={'center'} justifyContent={'space-between'}>
            {initialLoading ? (
              <PositionSkeleton width={90} height={24} />
            ) : isUnfinalized ? (
              <PositionSkeleton width={90} height={24} text="Finalizing..." />
            ) : isWaitingForRewards ? (
              <RewardSyncing />
            ) : (
              <Text fontSize={20}>
                {formatDisplayNumber(rewardInfoThisPosition?.claimableUsdValue || 0, {
                  significantDigits: 4,
                  style: 'currency',
                })}
              </Text>
            )}
            <Text fontSize={14} color={theme.subText}>
              {t`Claimable`}
            </Text>
          </Flex>

          <PositionAction
            small
            outline
            mobileAutoWidth
            disabled={initialLoading || isUnfinalized || !rewardInfoThisPosition?.claimableUsdValue || rewardsClaiming}
            onClick={() =>
              !initialLoading &&
              !isUnfinalized &&
              rewardInfoThisPosition?.claimableUsdValue &&
              !rewardsClaiming &&
              onOpenClaimRewards(position)
            }
          >
            {rewardsClaiming && <Loader size="14px" />}
            {rewardsClaiming ? t`Claiming` : t`Claim`}
          </PositionAction>
        </RewardDetailInfo>
      </RewardsSection>
    </>
  )
}

export const inProgressRewardTooltip = ({
  pendingUsdValue,
  vestingUsdValue,
  tokens,
}: {
  pendingUsdValue: number
  vestingUsdValue: number
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

  return (
    <ul style={{ marginTop: 4, marginBottom: 4, paddingLeft: 20 }}>
      <li>
        {t`Current Cycle`}:{' '}
        <b>
          {formatDisplayNumber(pendingUsdValue, {
            significantDigits: 4,
            style: 'currency',
          })}
        </b>{' '}
        {pendingTokens}
        {t`will move to “Vesting” when this cycle ends.`}
      </li>
      <li style={{ marginTop: 4 }}>
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
    </ul>
  )
}

export const totalRewardTooltip = ({
  lmTokens,
  egTokens,
  textColor,
}: {
  lmTokens: Array<TokenRewardInfo>
  egTokens: Array<TokenRewardInfo>
  textColor: string
}) => (
  <Flex flexDirection={'column'} sx={{ gap: 1 }}>
    <HorizontalDivider />
    <Text lineHeight={'16px'} fontSize={12}>
      {t`LM Reward:`}
      {!lmTokens.length ? ' 0' : ''}
    </Text>
    {lmTokens.map(token => (
      <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'} key={token.address}>
        <TokenLogo src={token.logo} size={16} />
        <Text color={textColor}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
        <Text color={textColor}>{token.symbol}</Text>
      </Flex>
    ))}
    <Text lineHeight={'16px'} fontSize={12}>
      {t`EG Sharing Reward:`}
      {!egTokens.length ? ' 0' : ''}
    </Text>
    {egTokens.map(token => (
      <Flex alignItems={'center'} sx={{ gap: 1 }} flexWrap={'wrap'} key={token.address}>
        <TokenLogo src={token.logo} size={16} />
        <Text color={textColor}>{formatDisplayNumber(token.totalAmount, { significantDigits: 4 })}</Text>
        <Text color={textColor}>{token.symbol}</Text>
      </Flex>
    ))}
  </Flex>
)

export default RewardSection
