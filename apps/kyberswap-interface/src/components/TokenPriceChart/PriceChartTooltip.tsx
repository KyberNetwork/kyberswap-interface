import { type TokenChartTimeFrame } from 'services/tokenChart'

import { Stack } from 'components/Stack'
import { type TooltipState, formatTooltipDate } from 'components/TokenPriceChart/chartOptions'
import useTheme from 'hooks/useTheme'
import { formatSignedPercent } from 'pages/Earns/PoolDetail/Information/utils'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

export const PriceChartTooltip = ({
  formatValue,
  timeFrame,
  tooltip,
}: {
  formatValue: (value?: number) => string
  timeFrame: TokenChartTimeFrame
  tooltip: TooltipState
}) => {
  const theme = useTheme()
  const { candle, left, top } = tooltip
  const priceChange = candle.changePercent ?? (candle.open ? ((candle.close - candle.open) / candle.open) * 100 : 0)
  const priceRange = candle.rangePercent ?? (candle.low ? ((candle.high - candle.low) / candle.low) * 100 : 0)

  return (
    <Stack
      className="pointer-events-none absolute z-[4] min-w-[220px] gap-3 rounded-xl border border-border bg-tableHeader/80 px-4 py-3"
      style={{ left, top, boxShadow: `0 12px 32px ${theme.shadow}` }}
    >
      <span className="text-xs text-subText">{formatTooltipDate(candle.time, timeFrame)}</span>

      <div className="grid grid-cols-[auto_auto] gap-x-4 gap-y-2">
        <span className="text-xs text-subText">Open</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.open)}</span>

        <span className="text-xs text-subText">High</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.high)}</span>

        <span className="text-xs text-subText">Low</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.low)}</span>

        <span className="text-xs text-subText">Close</span>
        <span className="text-right text-xs font-medium text-text">{formatValue(candle.close)}</span>

        <span className="text-xs text-subText">%Change</span>
        <span className={cn('text-right text-xs font-medium', priceChange >= 0 ? 'text-primary' : 'text-red')}>
          {formatSignedPercent(priceChange)}
        </span>

        <span className="text-xs text-subText">Range</span>
        <span className="text-right text-xs font-medium text-text">
          {formatSignedPercent(priceRange).replace(/^\+/, '')}
        </span>

        {candle.volume > 0 && (
          <>
            <span className="text-xs text-subText">Vol</span>
            <span className="text-right text-xs font-medium text-text">
              {formatDisplayNumber(candle.volume, { significantDigits: 4 })}
            </span>
          </>
        )}

        {candle.transactions !== undefined ? (
          <>
            <span className="text-xs text-subText">Transactions</span>
            <span className="text-right text-xs font-medium text-text">
              {formatDisplayNumber(candle.transactions, { significantDigits: 4 })}
            </span>
          </>
        ) : null}
      </div>
    </Stack>
  )
}
