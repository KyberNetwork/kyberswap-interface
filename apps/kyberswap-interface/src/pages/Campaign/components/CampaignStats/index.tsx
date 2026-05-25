import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { useGetLeaderboardQuery, useGetUserReferralTotalRewardQuery, useGetUserRewardQuery } from 'services/campaign'
import { useGetDashboardQuery, useGetParticipantQuery } from 'services/referral'

import InfoHelper from 'components/InfoHelper'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { StatCard } from 'pages/Campaign/styles'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

import NearIntentCampaignStats from './NearIntentCampaignStats'
import { WeekCountdown } from './WeekCountdown'

type Props = {
  type: CampaignType
  selectedWeek: number
}

export default function CampaignStats({ type, selectedWeek }: Props) {
  const { account } = useWeb3React()
  const { campaign, weeks, reward, program, year, url } = campaignConfig[type]

  const [searchParams] = useSearchParams()
  const page = +(searchParams.get('page') || '1')

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const isReferralCampaign = campaign === 'referral-program'

  const { data: userData } = useGetUserRewardQuery(
    {
      program,
      week: selectedWeek,
      year,
      wallet: account || '',
      campaign,
      url,
    },
    { skip: !account },
  )

  const { data: leaderboardData } = useGetLeaderboardQuery(
    {
      url,
      program,
      week: selectedWeek,
      year,
      campaign,
      pageSize: 10,
      pageNumber: page,
    },
    { skip: isReferralCampaign },
  )

  const { data: totalReferralData } = useGetDashboardQuery({ referralCode: '', page: 1 }, { skip: !isReferralCampaign })
  const totalParticipant = totalReferralData?.data.pagination.totalItems

  const { data: userRefData } = useGetParticipantQuery(
    { wallet: account || '' },
    { skip: !account || !isReferralCampaign },
  )
  const userRefCode = userRefData?.data?.participant?.referralCode

  const { data: userReferralData } = useGetDashboardQuery(
    { referralCode: userRefCode || '', page: 1 },
    { skip: !userRefCode || !isReferralCampaign },
  )
  const myTotalRefer = userReferralData?.data?.pagination?.totalItems

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { program, wallet: account || '' },
    { skip: !account || !isReferralCampaign },
  )

  const marketPriceMap = useTokenPrices([reward.address], reward.chainId)
  const price = marketPriceMap?.[reward.address] || 0

  const rewardAmount = CurrencyAmount.fromRawAmount(
    new Token(1, ZERO_ADDRESS, reward.decimals, 'mock'),
    userData?.data?.reward?.split('.')[0] || '0',
  )
  const rewardNumber = rewardAmount ? rewardAmount.toSignificant(4) : '0'
  const rewardUsd = price * +rewardAmount?.toExact() || 0

  const referralRewardAmount = CurrencyAmount.fromRawAmount(
    new Token(1, ZERO_ADDRESS, 18, 'mock'),
    referralData?.data?.totalReward.split('.')[0] || '0',
  )
  const referralReward = referralRewardAmount ? referralRewardAmount.toSignificant(4) : '0'
  const referralRewardUsd = price * +referralRewardAmount?.toExact() || 0

  const usd = isReferralCampaign ? referralRewardUsd : rewardUsd
  const participantCount = leaderboardData?.data?.participantCount
  const userPoint = userData?.data?.point

  const gridTemplateColumns =
    type === CampaignType.NearIntents
      ? upToMedium
        ? '1fr'
        : '1fr 1.2fr'
      : upToSmall
      ? '1fr'
      : !isReferralCampaign
      ? '1fr 1fr'
      : '1fr 2fr'

  return (
    <div className="mt-4 grid gap-3" style={{ gridTemplateColumns }}>
      <div className={cn('flex w-full gap-3', upToSmall ? 'flex-col' : 'flex-row')}>
        {!isReferralCampaign && <WeekCountdown weekOptions={weeks} selectedWeek={selectedWeek} />}

        <StatCard style={{ flex: 1 }}>
          <span className="text-sm text-subText">
            <Trans>Participants</Trans>
          </span>
          <p className="mt-2 text-xl font-medium">
            {isReferralCampaign
              ? formatDisplayNumber(totalParticipant, { significantDigits: 6 })
              : participantCount
              ? formatDisplayNumber(participantCount, { significantDigits: 6 })
              : '--'}
          </p>
        </StatCard>
      </div>

      {type === CampaignType.NearIntents ? (
        <NearIntentCampaignStats selectedWeek={selectedWeek} />
      ) : (
        <div className={cn('flex w-full gap-3', upToSmall ? 'flex-col' : 'flex-row')}>
          <StatCard style={{ flex: 1 }}>
            <span className="text-sm text-subText">{isReferralCampaign ? t`My referrals` : t`My Earned Points`}</span>
            <p className="mt-2 text-xl font-medium">
              {isReferralCampaign
                ? formatDisplayNumber(myTotalRefer || 0, { significantDigits: 4 })
                : userPoint
                ? formatDisplayNumber(Math.floor(userPoint), { significantDigits: 6 })
                : '--'}
            </p>
          </StatCard>
          <StatCard style={{ flex: 1 }}>
            <span className="text-sm text-subText">
              {t`My Est. Rewards`}{' '}
              <InfoHelper
                text={
                  <Trans>
                    The Estimated Rewards will vary based on the points earned by you and all campaign participants
                    during the week. Check out how they are calculated in the{' '}
                    <span className="font-medium text-primary">Information</span> tab.
                  </Trans>
                }
              />
            </span>
            <div className="mt-2 flex items-center text-xl font-medium">
              <img src={reward.logo} alt={reward.symbol} width="20px" height="20px" style={{ borderRadius: '50%' }} />
              <span className="ml-1 text-base">
                {isReferralCampaign ? referralReward : rewardNumber} {reward.symbol}
              </span>
              <span className="ml-1 text-sm text-subText">
                {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
              </span>
            </div>
          </StatCard>
        </div>
      )}
    </div>
  )
}
