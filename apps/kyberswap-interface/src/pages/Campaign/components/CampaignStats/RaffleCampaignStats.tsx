import { Trans } from '@lingui/macro'
import { useMemo } from 'react'
import { useMedia } from 'react-use'

import InfoHelper from 'components/InfoHelper'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { useRaffleCampaignJoin } from 'pages/Campaign/hooks/useRaffleCampaignJoin'
import { StatCard } from 'pages/Campaign/styles'
import { CampaignWeek } from 'pages/Campaign/timelines'
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
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  const { weeks: configWeeks } = campaignConfig[CampaignType.Raffle]
  const { participant, campaignStats } = useRaffleCampaignJoin({ selectedWeek, enabled: true })

  const weeks = useMemo(() => {
    if (configWeeks.length > 0) return configWeeks
    return campaignStats?.weeks ?? []
  }, [configWeeks, campaignStats])

  const weekPosition = getWeekPosition(weeks, selectedWeek)

  return (
    <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: upToSmall ? '1fr' : 'repeat(4, minmax(0, 1fr))' }}>
      <WeekCountdown weekOptions={weeks} selectedWeek={selectedWeek} />

      <StatCard>
        <div className="text-sm text-subText">
          <Trans>Participants</Trans>
        </div>
        <div className="mt-2 text-xl font-medium">
          {formatLabelValue(campaignStats, 'participant.week_' + weekPosition)}
        </div>
      </StatCard>

      <StatCard>
        <div className="text-sm text-subText">
          <Trans>Eligible Transactions</Trans>
        </div>
        <div className="mt-2 text-xl font-medium">
          {formatLabelValue(campaignStats, 'eligible.week_' + weekPosition)}
        </div>
      </StatCard>

      <StatCard>
        <div className="text-sm text-subText">
          <Trans>Your Transactions</Trans>{' '}
          <InfoHelper
            text={<Trans>Eligible transactions executed from your connected wallet during the selected week.</Trans>}
            placement="top"
          />
        </div>
        <div className="mt-2 text-xl font-medium">{formatLabelValue(participant, 'tx_count_week_' + weekPosition)}</div>
      </StatCard>
    </div>
  )
}
