import { CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetLeaderboardQuery, useGetUserReferralTotalRewardQuery, useGetUserRewardQuery } from 'services/campaign'
import { useGetDashboardQuery, useGetParticipantQuery } from 'services/referral'

import InfoHelper from 'components/InfoHelper'
import { ZERO_ADDRESS } from 'constants/index'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { StatCard } from 'pages/Campaign/styles'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import NearIntentCampaignStats from './NearIntentCampaignStats'
import { WeekCountdown } from './WeekCountdown'

type Props = {
  type: CampaignType
  selectedWeek: number
}

export default function CampaignStats({ type, selectedWeek }: Props) {
  const theme = useTheme()
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
    { skip: campaign === 'referral-program' },
  )

  const { data: totalReferralData } = useGetDashboardQuery({ referralCode: '', page: 1 })
  const totalParticipant = totalReferralData?.data.pagination.totalItems

  const { data: userRefData } = useGetParticipantQuery({ wallet: account || '' }, { skip: !account })
  const userRefCode = userRefData?.data?.participant?.referralCode

  const { data: userReferralData } = useGetDashboardQuery(
    { referralCode: userRefCode || '', page: 1 },
    { skip: !userRefCode },
  )
  const myTotalRefer = userReferralData?.data?.pagination?.totalItems

  const { data: referralData } = useGetUserReferralTotalRewardQuery(
    { program, wallet: account || '' },
    { skip: !account || campaign !== 'referral-program' },
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

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns:
          type === CampaignType.NearIntents
            ? upToMedium
              ? '1fr'
              : '1fr 1.2fr'
            : upToSmall
            ? '1fr'
            : !isReferralCampaign
            ? '1fr 1fr'
            : '1fr 2fr',
        marginTop: '1rem',
        gap: '12px',
      }}
    >
      <Flex width="100%" sx={{ gap: '12px' }} flexDirection={upToSmall ? 'column' : 'row'}>
        {!isReferralCampaign && <WeekCountdown weekOptions={weeks} selectedWeek={selectedWeek} />}

        <StatCard style={{ flex: 1 }}>
          <Text fontSize={14} color={theme.subText}>
            <Trans>Participants</Trans>
          </Text>
          <Text marginTop="8px" fontSize={20} fontWeight="500">
            {isReferralCampaign
              ? formatDisplayNumber(totalParticipant, { significantDigits: 6 })
              : participantCount
              ? formatDisplayNumber(participantCount, { significantDigits: 6 })
              : '--'}
          </Text>
        </StatCard>
      </Flex>

      {type === CampaignType.NearIntents ? (
        <NearIntentCampaignStats selectedWeek={selectedWeek} />
      ) : (
        <Flex width="100%" sx={{ gap: '12px' }} flexDirection={upToSmall ? 'column' : 'row'}>
          <StatCard style={{ flex: 1 }}>
            <Text fontSize={14} color={theme.subText}>
              {isReferralCampaign ? t`My referrals` : t`My Earned Points`}
            </Text>
            <Text marginTop="8px" fontSize={20} fontWeight="500">
              {isReferralCampaign
                ? formatDisplayNumber(myTotalRefer || 0, { significantDigits: 4 })
                : userPoint
                ? formatDisplayNumber(Math.floor(userPoint), { significantDigits: 6 })
                : '--'}
            </Text>
          </StatCard>
          <StatCard style={{ flex: 1 }}>
            <Text fontSize={14} color={theme.subText}>
              {t`My Est. Rewards`}{' '}
              <InfoHelper
                text={
                  <Trans>
                    The Estimated Rewards will vary based on the points earned by you and all campaign participants
                    during the week. Check out how they are calculated in the{' '}
                    <Text as="span" fontWeight="500" color={theme.primary}>
                      Information
                    </Text>{' '}
                    tab.
                  </Trans>
                }
              />
            </Text>
            <Flex marginTop="8px" fontSize={20} fontWeight="500" alignItems="center">
              <img src={reward.logo} alt={reward.symbol} width="20px" height="20px" style={{ borderRadius: '50%' }} />
              <Text marginLeft="4px" fontSize={16}>
                {isReferralCampaign ? referralReward : rewardNumber} {reward.symbol}
              </Text>
              <Text ml="4px" fontSize={14} color={theme.subText}>
                {formatDisplayNumber(usd, { style: 'currency', significantDigits: 4 })}
              </Text>
            </Flex>
          </StatCard>
        </Flex>
      )}
    </Box>
  )
}
