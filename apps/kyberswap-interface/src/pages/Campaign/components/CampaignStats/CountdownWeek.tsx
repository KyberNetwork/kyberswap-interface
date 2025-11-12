import { t } from '@lingui/macro'
import dayjs from 'dayjs'
import { ReactNode, useEffect, useState } from 'react'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { StatCard } from 'pages/Campaign/styles'

const formatCountdown = (totalSeconds: number): string => {
  const totalDays = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  const minutes = (totalMinutes % 60).toString().padStart(2, '0')

  return `${totalDays}D ${hours}H ${minutes}M ${seconds}S`
}

export type CampaignWeek = {
  value: number
  start: number
  end: number
  label?: ReactNode
}

type Props = {
  weekOptions: CampaignWeek[]
  selectedWeek: number
}

export const CountdownWeek = ({ weekOptions, selectedWeek }: Props) => {
  const theme = useTheme()

  const defaultWeek = weekOptions[0]
  const week = weekOptions.find(w => w.value === selectedWeek) || defaultWeek
  const startWeek = weekOptions[0]?.value ?? selectedWeek
  const weekIndex = selectedWeek - startWeek + 1

  const now = Math.floor(Date.now() / 1000)
  const isNotStart = now < week.start
  const isEnd = now >= week.end
  const duration = isNotStart ? week.start - now : week.end - now

  const [counter, setCounter] = useState(duration)

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (counter > 0) {
      timer = setTimeout(() => setCounter(prev => prev - 1), 1000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [counter])

  const statusText = isNotStart ? t`starting in` : isEnd ? t`ended at` : t`ending in`
  const startEndIn = t`Week ${weekIndex} ${statusText}`

  return (
    <StatCard style={{ flex: 1 }}>
      <Text fontSize={14} color={theme.subText}>
        {startEndIn}
      </Text>
      <Text marginTop="8px" fontSize={20} fontWeight="500">
        {isEnd ? dayjs(week.end * 1000).format('MMM DD YYYY') : formatCountdown(duration)}
      </Text>
    </StatCard>
  )
}
