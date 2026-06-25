import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useMemo, useState } from 'react'

import InfoHelper from 'components/InfoHelper'
import { DeltaRateLimitOrder, RateInfo } from 'components/LimitOrder/types'
import { removeTrailingZero } from 'components/LimitOrder/utils'
import NumericalInput from 'components/NumericalInput'
import { Stack } from 'components/Stack'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'

const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '' }
const RATE_DELTA_OPTIONS = [10, 20, 50]
const MIN_CUSTOM_PERCENT = -100

export const useGetDeltaRateLimitOrder = ({
  marketPrice,
  rateInfo,
}: {
  marketPrice?: BaseTradeInfo
  rateInfo: RateInfo
}): DeltaRateLimitOrder => {
  const { deltaText, percent } = useMemo(() => {
    try {
      if (marketPrice && rateInfo.rate !== '') {
        const ourRate = Number(rateInfo.rate)
        const marketRate = Number(marketPrice.marketRate)
        const percent = ((ourRate - marketRate) / marketRate) * 100
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

const DeltaRate = ({ symbol, deltaRate }: { symbol: string; deltaRate: DeltaRateLimitOrder }) => {
  const theme = useTheme()
  const { percent, profit } = deltaRate
  const color = profit ? theme.apr : theme.warning
  const colorClass = profit ? 'text-apr' : 'text-warning'
  const styledPercent = <span className={cn('font-medium', colorClass)}>{percent}</span>

  return (
    <div className="flex items-center whitespace-nowrap text-xs font-medium text-subText">
      <Trans>Sell {symbol} at rate</Trans>
      {percent ? (
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
      ) : null}
    </div>
  )
}

type PercentInputChipProps = {
  value: string
  isActive: boolean
  onActiveChange: (value: boolean) => void
  onFocusChange: (value: boolean) => void
  onUserInput: (value: string) => void
}

const PercentInputChip = ({ value, isActive, onActiveChange, onFocusChange, onUserInput }: PercentInputChipProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftValue, setDraftValue] = useState(value)
  const displayValue = isEditing ? draftValue : isActive ? value : ''
  const displayNumber = Number(displayValue)
  const isWarning = displayValue !== '' && displayValue !== '-' && Number.isFinite(displayNumber) && displayNumber < 0

  useEffect(() => {
    if (!isEditing) {
      setDraftValue(value)
    }
  }, [isEditing, value])

  const onChange = (nextValue: string) => {
    const normalizedValue =
      Number.isFinite(Number(nextValue)) && Number(nextValue) < MIN_CUSTOM_PERCENT
        ? String(MIN_CUSTOM_PERCENT)
        : nextValue

    setDraftValue(normalizedValue)
    if (!normalizedValue || normalizedValue === '-' || normalizedValue === '+') {
      onActiveChange(false)
      onUserInput('')
      return
    }
    if (normalizedValue.endsWith('.')) return
    onActiveChange(true)
    onUserInput(normalizedValue)
  }

  return (
    <div
      className={cn(
        'flex h-6 w-[82px] items-center rounded-lg border px-2 text-xs font-medium transition-colors',
        isActive
          ? 'border-primary-50 bg-tabActive text-text hover:bg-buttonGray'
          : 'border-border/60 text-subText hover:border-border-primary hover:text-primary',
        isWarning && 'border-warning/50',
      )}
    >
      <span className="shrink-0">{displayValue && !/^[+-]/.test(displayValue) ? '+' : ''}</span>
      <NumericalInput
        className="h-5 bg-transparent text-xs font-medium text-inherit placeholder:text-inherit"
        value={displayValue}
        placeholder={t`Custom`}
        onUserInput={onChange}
        onFocus={() => {
          setIsEditing(true)
          setDraftValue(value)
          onFocusChange(true)
          onActiveChange(true)
        }}
        onBlur={() => {
          setIsEditing(false)
          onFocusChange(false)
        }}
        maxLength={8}
        allowNegative
      />
      <span className="shrink-0">%</span>
    </div>
  )
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

type Props = {
  tokens?: RateSectionTokens
  rate?: RateSectionState
  events?: RateSectionEvents
}

const LimitOrderRateSection = ({ tokens = {}, rate = {}, events = {} }: Props) => {
  const { currencyIn, currencyOut } = tokens
  const { displayRate = '', rateInfo = DEFAULT_RATE_INFO, tradeInfo } = rate
  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })
  const unitCurrency = currencyOut
  const percentInputValue =
    deltaRate.rawPercent === undefined || !Number.isFinite(deltaRate.rawPercent)
      ? ''
      : removeTrailingZero(deltaRate.rawPercent.toFixed(2)) ?? ''
  const percentNumberValue = Number(percentInputValue)
  const isPercentOptionValue =
    percentInputValue !== '' && Number.isFinite(percentNumberValue) && RATE_DELTA_OPTIONS.includes(percentNumberValue)
  const [isCustomPercentActive, setIsCustomPercentActive] = useState(
    () => percentInputValue !== '' && !isPercentOptionValue,
  )
  const [isCustomPercentFocused, setIsCustomPercentFocused] = useState(false)

  useEffect(() => {
    if (isCustomPercentFocused) return
    setIsCustomPercentActive(percentInputValue !== '' && !isPercentOptionValue)
  }, [isCustomPercentFocused, isPercentOptionValue, percentInputValue])

  const setRateByDelta = (percent: number, inputMethod: 'custom' | 'preset' = 'custom') => {
    if (!tradeInfo) return
    if (inputMethod === 'preset') {
      setIsCustomPercentActive(false)
    }
    const nextRate = tradeInfo.marketRate * (1 + percent / 100)
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
        <DeltaRate symbol={currencyIn?.symbol ?? ''} deltaRate={deltaRate} />
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
          <PercentInputChip
            value={percentInputValue}
            isActive={isCustomPercentActive}
            onActiveChange={setIsCustomPercentActive}
            onFocusChange={setIsCustomPercentFocused}
            onUserInput={onChangePercent}
          />
          {RATE_DELTA_OPTIONS.map(percent => (
            <button
              key={percent}
              type="button"
              className={cn(
                'h-6 rounded-lg border px-2 text-xs font-medium transition-colors',
                percentInputValue !== '' && percentNumberValue === percent && !isCustomPercentActive
                  ? 'border-primary-50 bg-tabActive text-text hover:bg-buttonGray'
                  : 'border-border/60 text-subText hover:border-border-primary hover:text-primary',
              )}
              onClick={() => setRateByDelta(percent, 'preset')}
            >
              +{percent}%
            </button>
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
