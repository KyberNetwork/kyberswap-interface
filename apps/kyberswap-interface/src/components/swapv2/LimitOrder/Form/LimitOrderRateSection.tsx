import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'

import NumericalInput from 'components/NumericalInput'
import { Stack } from 'components/Stack'
import { removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
import { DeltaRateLimitOrder, RateInfo } from 'components/swapv2/LimitOrder/types'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import { cn } from 'utils/cn'

export const useGetDeltaRateLimitOrder = ({
  marketPrice,
  rateInfo,
}: {
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
}): DeltaRateLimitOrder => {
  const { deltaText, percent } = useMemo(() => {
    try {
      if (marketPrice && rateInfo.rate && rateInfo.invertRate) {
        const { rate, invert, invertRate } = rateInfo
        const ourRate = Number(invert ? invertRate : rate)
        const marketRate = Number(invert ? marketPrice.invertRate : marketPrice.marketRate)
        let percent = ((ourRate - marketRate) / marketRate) * 100
        if (invert) percent = -percent
        const delta = Number(percent)
        const sign = delta > 0 ? '+' : ''
        const deltaText = `${Math.abs(delta) > 100 ? '>100' : `${sign}${delta.toFixed(2)}`}%`
        return { percent, deltaText }
      }
    } catch (error) {
      console.log(error)
    }
    return { percent: undefined, deltaText: '' }
  }, [marketPrice, rateInfo])

  const percentText = Math.abs(Number(percent)) > 0.009 ? deltaText : ''
  return {
    rawPercent: percent,
    percent: percentText,
    profit: Boolean(percent && Number(percent) > 0),
  }
}

const RateLabel = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('text-xs font-medium text-subText', className)} {...rest}>
    {children}
  </div>
)

const DeltaRate = ({ symbol, invert }: { symbol: string; invert: boolean }) => {
  return (
    <RateLabel className="flex items-center whitespace-nowrap">
      {invert ? <Trans>Buy {symbol} at rate</Trans> : <Trans>Sell {symbol} at rate</Trans>}
    </RateLabel>
  )
}

const RateChip = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'h-6 rounded-lg border border-border/60 px-2 text-xs font-medium text-subText transition-colors hover:border-border-primary hover:text-primary',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
)

const PercentInputChip = ({ value, onUserInput }: { value: string; onUserInput: (value: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const displayValue = isEditing ? draftValue : value

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value)
    }
  }, [isEditing, value])

  const onChange = (nextValue: string) => {
    setDraftValue(nextValue)
    if (!nextValue || nextValue === '-' || nextValue === '+') {
      onUserInput('')
      return
    }
    if (nextValue.endsWith('.')) return
    onUserInput(nextValue)
  }

  return (
    <div className="flex h-6 w-[72px] items-center rounded-lg border border-border/60 px-2 text-xs font-medium text-text">
      <span className="shrink-0">{displayValue && !/^[+-]/.test(displayValue) ? '+' : ''}</span>
      <NumericalInput
        className="h-5 bg-transparent text-xs font-medium text-text"
        value={displayValue}
        onUserInput={onChange}
        onFocus={() => {
          setIsEditing(true)
          setDraftValue(value)
        }}
        onBlur={() => {
          setIsEditing(false)
        }}
        maxLength={8}
        allowNegative
      />
      <span className="shrink-0">%</span>
    </div>
  )
}

type Props = {
  tokens?: RateSectionTokens
  rate?: RateSectionState
  events?: RateSectionEvents
}

type RateSectionTokens = {
  currencyIn?: Currency
  currencyOut?: Currency
}

type RateSectionState = {
  displayRate?: string
  rateInfo?: RateInfo
  tradeInfo?: BaseTradeInfo
}

type RateSectionEvents = {
  onRateChange?: (value: string) => void
  onSetMarketRate?: () => void
  onRateInputFocus?: () => void
  onRateInputBlur?: () => void
}

const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '', invert: false }
const RATE_DELTA_OPTIONS = [10, 20, 50]

const LimitOrderRateSection = ({ tokens = {}, rate = {}, events = {} }: Props) => {
  const { currencyIn, currencyOut } = tokens
  const { displayRate = '', rateInfo = DEFAULT_RATE_INFO, tradeInfo } = rate
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })
  const unitCurrency = rateInfo.invert ? currencyIn : currencyOut
  const percentInputValue =
    deltaRate.rawPercent === undefined || !Number.isFinite(deltaRate.rawPercent)
      ? ''
      : removeTrailingZero(deltaRate.rawPercent.toFixed(2)) ?? ''

  const setRateByDelta = (percent: number) => {
    if (!tradeInfo) return
    const market = rateInfo.invert ? tradeInfo.invertRate : tradeInfo.marketRate
    const nextRate = market * (1 + (rateInfo.invert ? -percent : percent) / 100)
    events.onRateChange?.(removeTrailingZero(nextRate.toFixed(16)) ?? '')
  }

  const onChangePercent = (value: string) => {
    if (!value || value === '-') {
      events.onRateChange?.('')
      return
    }
    setRateByDelta(Number(value))
  }

  return (
    <Stack className="gap-3 rounded-2xl bg-buttonBlack p-4">
      <div className="flex items-center justify-between gap-3">
        <DeltaRate
          invert={rateInfo.invert}
          symbol={(rateInfo.invert ? currencyOut?.symbol : currencyIn?.symbol) ?? ''}
        />
      </div>

      <div className="flex min-h-8 items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center">
          <NumericalInput
            maxLength={50}
            className="bg-transparent text-xl font-medium text-primary"
            data-testid="input-selling-rate"
            value={displayRate}
            onUserInput={events.onRateChange}
            onFocus={events.onRateInputFocus}
            onBlur={events.onRateInputBlur}
          />
        </div>
        {unitCurrency && (
          <div className="flex shrink-0 items-center rounded-full bg-buttonGray px-3 py-1 text-base font-medium text-subText">
            {unitCurrency.symbol}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          <PercentInputChip value={percentInputValue} onUserInput={onChangePercent} />
          {RATE_DELTA_OPTIONS.map(percent => (
            <RateChip key={percent} onClick={() => setRateByDelta(percent)}>
              +{percent}%
            </RateChip>
          ))}
        </div>
        {tradeInfo ? (
          <button
            type="button"
            className="h-6 rounded-full bg-primary-20 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary-30"
            onClick={events.onSetMarketRate}
          >
            <Trans>Market</Trans>
          </button>
        ) : null}
      </div>
    </Stack>
  )
}

export default LimitOrderRateSection
