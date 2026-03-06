import dayjs from 'dayjs'
import { Text } from 'rebass'
import { type PoolAnalyticsWindow } from 'services/zapEarn'
import styled from 'styled-components'

import { HStack, Stack } from 'components/Stack'
import useTheme from 'hooks/useTheme'
import PositionSkeleton from 'pages/Earns/components/PositionSkeleton'
import { formatDisplayNumber } from 'utils/numbers'

export const ANALYTICS_WINDOW_OPTIONS = [
  { label: '24H', value: '24h' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
] as const

export const MetricsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: repeat(2, minmax(0, 1fr));
  `}

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  `}
`

export const MetricCard = styled(Stack)`
  min-width: 0;
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonGray};
`

export const SectionCard = styled(Stack)`
  padding: 16px;
  border-radius: 16px;
  background: ${({ theme }) => theme.buttonGray};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 14px;
  `}
`

export const SectionHeader = styled(HStack)`
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`

export const ChartWrapper = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`

const SelectorContainer = styled.div`
  display: grid;
  position: relative;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: center;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.background};
`

const SelectorActivePill = styled.div<{ $activeIndex: number }>`
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  width: calc((100% - 2px) / 3);
  border-radius: 999px;
  background: ${({ theme }) => theme.tabActive};
  transform: translateX(calc(100% * ${({ $activeIndex }) => $activeIndex}));
  transition: transform 200ms ease, background 200ms ease;
  pointer-events: none;
`

const SelectorButton = styled.button<{ $active: boolean }>`
  position: relative;
  z-index: 1;
  min-width: 48px;
  padding: 8px 12px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme, $active }) => ($active ? theme.text : theme.subText)};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 200ms ease, background 200ms ease;

  :hover {
    background: ${({ theme, $active }) => ($active ? 'transparent' : theme.buttonGray)};
  }
`

const StateWrapper = styled(Stack)<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
  padding: 20px;
  border: 1px dashed ${({ theme }) => theme.border};
  border-radius: 16px;
  align-items: center;
  justify-content: center;
  text-align: center;
`

const COMPACT_UNITS = [
  { divisor: 1_000_000_000, suffix: 'B' },
  { divisor: 1_000_000, suffix: 'M' },
  { divisor: 1_000, suffix: 'K' },
] as const

const hasValue = (value?: number | null): value is number =>
  value !== undefined && value !== null && !Number.isNaN(value)

export const formatUsd = (value?: number) =>
  hasValue(value) ? formatDisplayNumber(value, { style: 'currency', significantDigits: 6 }) : '--'

export const formatSignedUsd = (value?: number) =>
  hasValue(value)
    ? `${value > 0 ? '+' : ''}${formatDisplayNumber(value, { style: 'currency', significantDigits: 6 })}`
    : '--'

export const formatNumber = (value?: number) =>
  hasValue(value) ? formatDisplayNumber(value, { significantDigits: 6 }) : '--'

export const formatPriceNumber = (value?: number) =>
  hasValue(value)
    ? formatDisplayNumber(value, {
        significantDigits: value !== 0 && Math.abs(value) < 1 ? 8 : 6,
      })
    : '--'

export const formatSignedPercent = (value?: number) =>
  hasValue(value) ? `${value > 0 ? '+' : ''}${formatDisplayNumber(value, { significantDigits: 4 })}%` : '--'

export const formatCompactCurrency = (value?: number) => {
  if (!hasValue(value)) return '--'

  const sign = value < 0 ? '-' : ''
  const absoluteValue = Math.abs(value)
  const unit = COMPACT_UNITS.find(item => absoluteValue >= item.divisor)

  if (!unit) {
    return `${sign}$${formatDisplayNumber(absoluteValue, { significantDigits: 4 })}`
  }

  return `${sign}$${formatDisplayNumber(absoluteValue / unit.divisor, { significantDigits: 4 })}${unit.suffix}`
}

export const formatAxisTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '24h') return dayjs.unix(timestamp).format('HH:mm')
  if (window === '7d') return dayjs.unix(timestamp).format('MMM D')
  return dayjs.unix(timestamp).format('MMM D')
}

export const formatTooltipTimeLabel = (timestamp: number, window: PoolAnalyticsWindow) => {
  if (window === '30d') return dayjs.unix(timestamp).format('MMM D, YYYY')
  return dayjs.unix(timestamp).format('MMM D, HH:mm')
}

export const WindowSelector = ({
  window,
  onSelect,
}: {
  window: PoolAnalyticsWindow
  onSelect: (value: PoolAnalyticsWindow) => void
}) => {
  const activeIndex = ANALYTICS_WINDOW_OPTIONS.findIndex(option => option.value === window)

  return (
    <SelectorContainer>
      <SelectorActivePill $activeIndex={Math.max(activeIndex, 0)} />
      {ANALYTICS_WINDOW_OPTIONS.map(option => (
        <SelectorButton
          $active={option.value === window}
          key={option.value}
          onClick={() => onSelect(option.value)}
          type="button"
        >
          {option.label}
        </SelectorButton>
      ))}
    </SelectorContainer>
  )
}

export const ChartState = ({ height, message }: { height: number; message: string }) => {
  const theme = useTheme()

  return (
    <StateWrapper $height={height} gap={8}>
      <Text color={theme.text} fontSize={15} fontWeight={500}>
        {message}
      </Text>
    </StateWrapper>
  )
}

export const ChartLoadingState = ({ height }: { height: number }) => (
  <StateWrapper $height={height} gap={12}>
    <PositionSkeleton width="100%" height={Math.max(height - 40, 120)} />
  </StateWrapper>
)
