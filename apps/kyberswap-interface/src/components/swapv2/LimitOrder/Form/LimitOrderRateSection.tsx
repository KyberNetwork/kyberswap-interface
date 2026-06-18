import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'
import { Repeat } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import InfoHelper from 'components/InfoHelper'
import NumericalInput from 'components/NumericalInput'
import { removeTrailingZero } from 'components/swapv2/LimitOrder/helpers'
import { DeltaRateLimitOrder, RateInfo } from 'components/swapv2/LimitOrder/types'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

export function useGetDeltaRateLimitOrder({
  marketPrice,
  rateInfo,
}: {
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
}): DeltaRateLimitOrder {
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

const DeltaRate = ({
  marketPrice,
  rateInfo,
  symbol,
  invert,
}: {
  marketPrice: BaseTradeInfo | undefined
  rateInfo: RateInfo
  symbol: string
  invert: boolean
}) => {
  const theme = useTheme()

  const { percent, profit } = useGetDeltaRateLimitOrder({ marketPrice, rateInfo })
  const color = profit ? theme.apr : theme.warning
  const colorClass = profit ? 'text-apr' : 'text-warning'
  const styledPercent = <span className={cn('font-medium', colorClass)}>{percent}</span>
  return (
    <RateLabel className="flex items-center whitespace-nowrap">
      {invert ? <Trans>Buy {symbol} at rate</Trans> : <Trans>Sell {symbol} at rate</Trans>}
      {percent ? (
        <>
          <span className={colorClass}>&nbsp;{percent}</span>
          <InfoHelper
            color={color}
            text={
              profit ? (
                <Trans>Your selected price is {styledPercent} better than the current market price.</Trans>
              ) : (
                <Trans>Your selected price is {styledPercent} worse than the current market price.</Trans>
              )
            }
          />
        </>
      ) : null}
    </RateLabel>
  )
}

const RateCard = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 rounded-2xl bg-buttonBlack p-3', className)} {...rest}>
    {children}
  </div>
)

const RateChip = ({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={cn(
      'h-7 rounded-lg border border-subText/20 px-2 text-xs font-medium text-subText transition-colors hover:border-primary hover:text-primary',
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
    <div className="flex h-7 items-center rounded-lg border border-subText/30 px-2 text-xs font-medium text-text">
      <span className="shrink-0">{displayValue && !/^[+-]/.test(displayValue) ? '+' : ''}</span>
      <NumericalInput
        className="h-5 w-[46px] bg-transparent text-xs font-medium text-text"
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
  onInvertRate?: (invert: boolean) => void
  onSetMarketRate?: () => void
  onRateInputFocus?: () => void
  onRateInputBlur?: () => void
}

const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '', invert: false }
const RATE_DELTA_OPTIONS = [10, 20, 50]

export default function LimitOrderRateSection({ tokens = {}, rate = {}, events = {} }: Props) {
  const { currencyIn, currencyOut } = tokens
  const { displayRate = '', rateInfo = DEFAULT_RATE_INFO, tradeInfo } = rate
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })
  const marketRate = tradeInfo
    ? removeTrailingZero((rateInfo.invert ? tradeInfo.invertRate : tradeInfo.marketRate).toPrecision(6))
    : ''
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
    <RateCard>
      <div className="flex items-center justify-between gap-3">
        <DeltaRate
          invert={rateInfo.invert}
          symbol={(rateInfo.invert ? currencyOut?.symbol : currencyIn?.symbol) ?? ''}
          marketPrice={tradeInfo}
          rateInfo={rateInfo}
        />
        {currencyIn && currencyOut && unitCurrency && (
          <button
            type="button"
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-buttonGray px-3 text-sm font-medium text-subText hover:brightness-125"
            onClick={() => events.onInvertRate?.(!rateInfo.invert)}
          >
            <CurrencyLogo size="18px" currency={unitCurrency} />
            <span className="select-none">{unitCurrency.symbol}</span>
            <Repeat className="text-subText" size={12} />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="flex min-h-11 min-w-0 flex-1 items-center rounded-xl border border-subText/20 bg-background px-3">
          <NumericalInput
            maxLength={50}
            className="h-9 bg-transparent text-xl font-medium text-primary"
            data-testid="input-selling-rate"
            value={displayRate}
            onUserInput={events.onRateChange}
            onFocus={events.onRateInputFocus}
            onBlur={events.onRateInputBlur}
          />
        </div>
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
          <button type="button" className="text-xs font-medium text-subText" onClick={events.onSetMarketRate}>
            <Trans>Market</Trans> <span className="text-primary">{marketRate}</span>
          </button>
        ) : null}
      </div>
    </RateCard>
  )
}
