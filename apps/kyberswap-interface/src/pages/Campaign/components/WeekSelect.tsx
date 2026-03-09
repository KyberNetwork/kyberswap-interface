import { Trans } from '@lingui/macro'
import dayjs from 'dayjs'
import { useEffect, useMemo } from 'react'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import { useGetRaffleCampaignStatsQuery } from 'services/campaignRaffle'

import Select, { SelectOption } from 'components/Select'
import useTheme from 'hooks/useTheme'
import { CampaignType, campaignConfig } from 'pages/Campaign/constants'
import { getCurrentWeek, resolveSelectedCampaignWeek } from 'pages/Campaign/utils'
import { MEDIA_WIDTHS } from 'theme'

type Props = {
  type: CampaignType
  selectedWeek: number
  setSelectedWeek: React.Dispatch<React.SetStateAction<number>>
}

const WeekSelect = ({ type, selectedWeek, setSelectedWeek }: Props) => {
  const theme = useTheme()
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  const { year, weeks: configWeeks } = campaignConfig[type]
  const { currentWeek, currentYear } = getCurrentWeek()

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

  useEffect(() => {
    setSelectedWeek(current => {
      const resolvedWeek = resolveSelectedCampaignWeek(weeks, current, dayjs().unix())
      return resolvedWeek ? resolvedWeek.value : current
    })
  }, [setSelectedWeek, weeks, type])

  return (
    <Select
      options={weeks as SelectOption[]}
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
        const isActive = value?.value === currentWeek && year === currentYear
        return (
          <Text color={isSelected ? theme.primary : theme.subText} display="flex" alignItems="center">
            {value?.label}{' '}
            {isActive && (
              <Text as="span" color={theme.red1} fontSize={12} ml="4px">
                <Trans>Active</Trans>
              </Text>
            )}
          </Text>
        )
      }}
    />
  )
}

export default WeekSelect
