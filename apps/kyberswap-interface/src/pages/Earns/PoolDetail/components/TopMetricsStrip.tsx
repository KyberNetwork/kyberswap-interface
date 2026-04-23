import { rgba } from 'polished'
import { type ReactNode } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'

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
  gap: 12px;

  ${({ $split, theme }) =>
    !$split &&
    css`
      padding: 16px;
      border-radius: 16px;
      background: ${rgba(theme.buttonGray, 0.8)};
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
      background: ${rgba(theme.buttonGray, 0.8)};
    `}
`

const EllipsisText = styled(Text)<{ color?: string }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ color }) => color};
`

const MetricValue = ({ value }: { value: ReactNode }) => {
  const theme = useTheme()
  if (typeof value === 'string' || typeof value === 'number') {
    return (
      <EllipsisText color={theme.text} fontWeight={500}>
        {value}
      </EllipsisText>
    )
  }
  return <>{value}</>
}

const TopMetricsStrip = ({ items, split = false }: { items: TopMetricItem[]; split?: boolean }) => {
  const theme = useTheme()
  return (
    <MetricsGrid $columns={items.length} $split={split}>
      {items.map(metric => (
        <MetricCard $split={split} key={metric.label}>
          <EllipsisText color={theme.subText} fontSize={14}>
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
