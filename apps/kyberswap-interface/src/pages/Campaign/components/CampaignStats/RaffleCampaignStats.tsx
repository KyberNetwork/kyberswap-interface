import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'
import { Box, Text } from 'rebass'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { CampaignType, CampaignWeek, campaignConfig } from 'pages/Campaign/constants'
import { useRaffleCampaignJoin } from 'pages/Campaign/hooks/useRaffleCampaignJoin'
import { StatCard } from 'pages/Campaign/styles'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { WeekCountdown } from './WeekCountdown'

const formatLabelValue = (data: Record<string, any> | undefined, key: string) => {
  return data?.[key] !== undefined ? formatDisplayNumber(data[key], { significantDigits: 6 }) : '--'
}

const getWeekPosition = (weeks: CampaignWeek[], selectedWeek: number) => {
  const index = weeks.findIndex(week => week.value === selectedWeek)
  return (index === -1 ? 0 : index) + 1
}

export default function RaffleCampaignStats({ selectedWeek }: { selectedWeek: number }) {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { weeks: configWeeks } = campaignConfig[CampaignType.Raffle]
  const { participant, campaignStats } = useRaffleCampaignJoin({ selectedWeek })

  const weeks = useMemo(() => {
    if (configWeeks.length > 0) return configWeeks
    return campaignStats?.weeks ?? []
  }, [configWeeks, campaignStats])

  const weekPosition = getWeekPosition(weeks, selectedWeek)

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: upToSmall ? '1fr' : 'repeat(4, minmax(0, 1fr))',
        marginTop: '1rem',
        gap: '12px',
      }}
    >
      <WeekCountdown weekOptions={weeks} selectedWeek={selectedWeek} />

      <StatCard>
        <Text fontSize={14} color={theme.subText}>
          <Trans>Participants</Trans>
        </Text>
        <Text marginTop="8px" fontSize={20} fontWeight="500">
          {formatLabelValue(campaignStats, 'participant.week_' + weekPosition)}
        </Text>
      </StatCard>

      <StatCard>
        <Text fontSize={14} color={theme.subText}>
          <Trans>Eligible Transactions</Trans>
        </Text>
        <Text marginTop="8px" fontSize={20} fontWeight="500">
          {formatLabelValue(campaignStats, 'eligible.week_' + weekPosition)}
        </Text>
      </StatCard>

      <StatCard>
        <Text fontSize={14} color={theme.subText}>
          <Trans>Your Transactions</Trans>{' '}
          <InfoHelper
            text={<Trans>Eligible transactions executed from your connected wallet during the selected week.</Trans>}
            placement="top"
          />
        </Text>
        <Text marginTop="8px" fontSize={20} fontWeight="500">
          {formatLabelValue(participant, 'tx_count_week_' + weekPosition)}
        </Text>
      </StatCard>
    </Box>
  )
}
