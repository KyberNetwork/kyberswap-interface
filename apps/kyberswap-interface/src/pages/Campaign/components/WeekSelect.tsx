import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetRaffleCampaignStatsQuery } from 'services/campaignRaffle'

import Select, { SelectOption } from 'components/Select'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
import { MEDIA_WIDTHS } from 'theme'

type Props = {
  type: CampaignType
  selectedWeek: number
  setSelectedWeek: React.Dispatch<React.SetStateAction<number>>
}

const WeekSelect = ({ type, selectedWeek, setSelectedWeek }: Props) => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const { weeks: configWeeks } = campaignConfig[type]

  const { data: raffleCampaignStats } = useGetRaffleCampaignStatsQuery(undefined, {
    skip: type !== CampaignType.Raffle,
  })
  const weeks = useMemo(() => {
    if (configWeeks.length > 0) return configWeeks
    if (type === CampaignType.Raffle && raffleCampaignStats) {
      return raffleCampaignStats.weeks || []
    }
    return configWeeks
  }, [type, configWeeks, raffleCampaignStats])

  const weekOptions = useMemo<SelectOption[]>(
    () =>
      weeks.map((week, index) => ({
        value: week.value,
        label: week.label ?? `Week ${week.value}`,
        disabled: index !== 0 && dayjs().unix() < week.start,
      })),
    [weeks],
  )

  useEffect(() => {
    setSelectedWeek(current => {
      const resolvedWeek = resolveSelectedCampaignWeek(weeks, current)
      return resolvedWeek ? resolvedWeek.value : current
    })
  }, [setSelectedWeek, weeks, type])

  return (
    <Select
      options={weekOptions}
      placement="bottom-start"
      style={{
        fontSize: '16px',
        border: `1px solid ${theme.border}`,
        width: upToExtraSmall ? '100%' : '260px',
      }}
      optionStyle={{
        fontSize: '16px',
        width: upToExtraSmall ? 'calc(100vw - 48px)' : undefined,
      }}
      onChange={value => setSelectedWeek(value)}
      value={selectedWeek}
      optionRender={value => {
        const isSelected = value?.value === selectedWeek
        return (
          <Text color={isSelected ? theme.primary : theme.subText} display="flex" alignItems="center">
            {value?.label}
          </Text>
        )
      }}
    />
  )
}

export default WeekSelect
