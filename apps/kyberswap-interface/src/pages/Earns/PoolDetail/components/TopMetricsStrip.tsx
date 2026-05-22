import { type ReactNode } from 'react'
import { useMedia } from 'react-use'

import { Stack } from 'components/Stack'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

type TopMetricItem = {
  label: string
  value: ReactNode
}

const MetricValue = ({ value }: { value: ReactNode }) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="overflow-hidden truncate whitespace-nowrap font-medium text-text">{value}</span>
  }
  return <>{value}</>
}

const TopMetricsStrip = ({ items, split = false }: { items: TopMetricItem[]; split?: boolean }) => {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const cols = upToSmall ? Math.min(items.length, 2) : upToMedium ? Math.min(items.length, 3) : items.length
  return (
    <div
      className={cn('grid gap-3', !split && 'bg-buttonGray/80 rounded-2xl p-4')}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map(metric => (
        <Stack key={metric.label} gap="4px" className={cn('min-w-0', split && 'bg-buttonGray/80 rounded-2xl p-4')}>
          <span className="overflow-hidden truncate whitespace-nowrap text-sm text-subText">{metric.label}</span>
          <MetricValue value={metric.value} />
        </Stack>
      ))}
    </div>
  )
}

export type { TopMetricItem }

export default TopMetricsStrip
