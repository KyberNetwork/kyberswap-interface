import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import { useMedia } from 'react-use'
import { Box, Text } from 'rebass'
import { useGetRaffleCampaignStatsQuery } from 'services/raffleCampaign'

import InfoHelper from 'components/InfoHelper'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { StatCard } from 'pages/Campaign/styles'
import { MEDIA_WIDTHS } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { CountdownWeek } from './CountdownWeek'

type CampaignWeek = {
  value: number
  start: number
  end: number
  label?: ReactNode
}

const formatLabelValue = (campaignStats: Record<string, any> | undefined, key: string) => {
  return campaignStats?.[key] !== undefined ? formatDisplayNumber(campaignStats[key], { significantDigits: 6 }) : '--'
}

const getWeekPosition = (weeks: CampaignWeek[], selectedWeek: number) => {
  const index = weeks.findIndex(week => week.value === selectedWeek)
  return (index === -1 ? 0 : index) + 1
}

export default function RaffleCampaignStats({ selectedWeek }: { selectedWeek: number }) {
  const theme = useTheme()
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { weeks } = campaignConfig[CampaignType.Raffle]
  const weekPosition = getWeekPosition(weeks, selectedWeek)

  const { data: campaignStats } = useGetRaffleCampaignStatsQuery()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: upToSmall ? '1fr' : 'repeat(4, minmax(0, 1fr))',
        marginTop: '1rem',
        gap: '12px',
      }}
    >
      <CountdownWeek weekOptions={weeks} selectedWeek={selectedWeek} />

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
          {'--'}
        </Text>
      </StatCard>
    </Box>
  )
}
