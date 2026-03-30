import { type ReactNode } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { Stack } from 'components/Stack'

type TopMetricItem = {
  label: string
  value: ReactNode
}

type MetricsGridProps = {
  $columns: number
  $split: boolean
}

type MetricCardProps = {
  $split: boolean
}

const getGridColumns = (columns: number) => `repeat(${columns}, minmax(0, 1fr))`

const MetricsGrid = styled.div<MetricsGridProps>`
  display: grid;
  grid-template-columns: ${({ $columns }) => getGridColumns($columns)};
  gap: 16px;

  ${({ $split, theme }) =>
    !$split &&
    css`
      padding: 16px;
      border-radius: 16px;
      background: ${theme.buttonGray};
    `}

  ${({ theme, $columns }) => theme.mediaWidth.upToMedium`
    grid-template-columns: ${getGridColumns(Math.min($columns, 3))};
  `}

  ${({ theme, $columns, $split }) => theme.mediaWidth.upToSmall`
    grid-template-columns: ${getGridColumns(Math.min($columns, 2))};
    gap: 12px;
    ${!$split ? 'padding: 16px;' : ''}
  `}
`

const MetricCard = styled(Stack)<MetricCardProps>`
  min-width: 0;
  gap: 4px;

  ${({ $split, theme }) =>
    $split &&
    css`
      padding: 16px;
      border-radius: 16px;
      background: ${theme.buttonGray};
    `}
`

const EllipsisText = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MetricValue = ({ value }: { value: ReactNode }) => {
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <EllipsisText fontWeight={500} color="text">
        {value}
      </EllipsisText>
    )
  }

  return <>{value}</>
}

const TopMetricsStrip = ({ items, split = false }: { items: TopMetricItem[]; split?: boolean }) => {
  return (
    <MetricsGrid $columns={items.length} $split={split}>
      {items.map(metric => (
        <MetricCard $split={split} key={metric.label}>
          <EllipsisText fontSize={14} color="subText">
            {metric.label}
          </EllipsisText>
          <MetricValue value={metric.value} />
        </MetricCard>
      ))}
    </MetricsGrid>
  )
}

export type { TopMetricItem }

export default TopMetricsStrip
