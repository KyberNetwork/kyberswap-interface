import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'
import { useGetRaffleCampaignParticipantQuery, useGetRaffleCampaignStatsQuery } from 'services/campaignRaffle'

import Divider from 'components/Divider'
import { useWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export default function MyRaffleDashboard() {
  const theme = useTheme()
  const { account } = useWeb3React()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { reward } = campaignConfig[CampaignType.Raffle]

  const { data: campaignStats } = useGetRaffleCampaignStatsQuery()
  const { data: participant } = useGetRaffleCampaignParticipantQuery({ address: account || '' }, { skip: !account })

  const weeks = campaignStats?.weeks ?? []

  return (
    <Box marginTop="1.25rem" sx={{ borderRadius: '20px', background: theme.background }} padding="1.5rem">
      <Flex mb="24px" sx={{ rowGap: '1rem', columnGap: '4rem', flexWrap: 'wrap' }}>
        <Box minWidth={120}>
          <Text color={theme.subText}>
            <Trans>Total Wins</Trans>
          </Text>
          <Flex alignItems="center" sx={{ gap: '8px', marginTop: '8px' }}>
            <img src={reward.logo} alt={reward.symbol} width="20px" height="20px" style={{ borderRadius: '50%' }} />
            <Text fontSize={18} fontWeight="500" color={theme.text}>
              {formatDisplayNumber(participant?.reward, { significantDigits: 6 })} {reward.symbol}
            </Text>
          </Flex>
        </Box>

        {!!participant?.reward && (
          <Box flex={1} minWidth={280}>
            <Text color={theme.subText}>
              <Trans>You&apos;ve won 🎁 Week 1/2 Raffle Campaign.</Trans>
            </Text>
            <Text fontSize={14} color={theme.subText} marginTop="8px">
              <Trans>
                Your rewards will be distributed directly to your wallet within 7 business days after the announcement.
              </Trans>
            </Text>
          </Box>
        )}
      </Flex>

      <Divider />

      {!upToSmall && (
        <>
          <Flex padding="1rem 0" color={theme.subText} fontSize="12px" fontWeight="500">
            <Text flex={1}>
              <Trans>WEEK</Trans>
            </Text>
            <Text flex={1}>
              <Trans>ELIGIBLE TRANSACTIONS</Trans>
            </Text>
          </Flex>
          <Divider />
        </>
      )}

      {upToSmall ? (
        <Flex
          flexDirection="column"
          paddingY="1rem"
          sx={{ gap: '1rem' }}
          color={theme.subText}
          fontWeight="500"
          fontSize={14}
        >
          <WeekRewardLine title={weeks[0]?.label} txCount={participant?.tx_count_week_1 || 0} />
          <Divider />
          <WeekRewardLine title={weeks[1]?.label} txCount={participant?.tx_count_week_2 || 0} />
        </Flex>
      ) : (
        <>
          <WeekRewardLine title={weeks[0]?.label} txCount={participant?.tx_count_week_1 || 0} />
          <WeekRewardLine title={weeks[1]?.label} txCount={participant?.tx_count_week_2 || 0} />
        </>
      )}
    </Box>
  )
}

const WeekRewardLine = ({ title, txCount }: { title: ReactNode; txCount: number }) => {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  return upToSmall ? (
    <Flex flexDirection="column" sx={{ gap: '1rem' }}>
      <Text flex={1}>{title}</Text>
      <Flex justifyContent="space-between">
        <Text flex={1}>ELIGIBLE TRANSACTIONS</Text>
        <Text color="white" fontSize={16}>
          {formatDisplayNumber(txCount, { significantDigits: 6 })}
        </Text>
      </Flex>
    </Flex>
  ) : (
    <Flex padding="1rem 0" color={theme.subText} fontWeight="500" fontSize={14}>
      <Text flex={1}>{title}</Text>
      <Text flex={1} color="white">
        {formatDisplayNumber(txCount, { significantDigits: 6 })}
      </Text>
    </Flex>
  )
}
