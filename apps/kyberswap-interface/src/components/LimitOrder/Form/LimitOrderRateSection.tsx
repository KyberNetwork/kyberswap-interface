import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useMemo, useState } from 'react'
import { Repeat } from 'react-feather'

import InfoHelper from 'components/InfoHelper'
import MarketPrice from 'components/LimitOrder/Form/MarketPrice'
import { DeltaRateLimitOrder, RateInfo } from 'components/LimitOrder/types'
import { formatPriceInputValue } from 'components/LimitOrder/utils'
import NumericalInput from 'components/NumericalInput'
import PercentPresetSelector from 'components/PercentPresetSelector'
import { HStack, Stack } from 'components/Stack'
import { BaseTradeInfo } from 'hooks/useBaseTradeInfo'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'
import { formatPercentageInput } from 'utils/numbers'

const DEFAULT_RATE_INFO: RateInfo = { rate: '', invertRate: '' }
const RATE_DELTA_OPTIONS = [10, 20, 50]
const normalizeCustomPercent = (value: string) =>
  Number.isFinite(Number(value)) && Number(value) < -100 ? '-100' : value

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
    } catch {
      // Keep the empty comparison when the market rate cannot be read.
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

type DeltaRateProps = {
  deltaRate: DeltaRateLimitOrder
}

const DeltaRate = ({ deltaRate }: DeltaRateProps) => {
  const theme = useTheme()
  const { percent, profit } = deltaRate
  const color = profit ? theme.apr : theme.warning
  const colorClass = profit ? 'text-apr' : 'text-warning'
  const styledPercent = <span className={cn('font-medium', colorClass)}>{percent}</span>

  return (
    <div className="flex items-center whitespace-nowrap text-sm font-medium text-subText">
      <Trans>Rate</Trans>
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

type RateSectionTokens = {
  currencyIn?: Currency
  currencyOut?: Currency
}

type RateSectionState = {
  displayRate?: string
  rateInfo?: RateInfo
  tradeInfo?: BaseTradeInfo
  loadingTrade?: boolean
}

type RateSectionEvents = {
  onRateChange?: (value: string) => void
  onInvertedRateChange?: (value: string) => void
  onRatePresetClick?: (preset: string) => void
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
  const { displayRate = '', rateInfo = DEFAULT_RATE_INFO, tradeInfo, loadingTrade } = rate
  const [showInvertedRate, setShowInvertedRate] = useState(false)

  const deltaRate = useGetDeltaRateLimitOrder({ marketPrice: tradeInfo, rateInfo })
  const baseCurrency = showInvertedRate ? currencyOut : currencyIn
  const quoteCurrency = showInvertedRate ? currencyIn : currencyOut
  const rateValue = showInvertedRate ? rateInfo.invertRate : displayRate
  const onRateValueChange = showInvertedRate ? events.onInvertedRateChange : events.onRateChange

  const percentInputValue = formatPercentageInput(deltaRate.rawPercent)
  const setRateByDelta = (percent: number) => {
    if (!tradeInfo) return
    const nextRate = tradeInfo.marketRate * (1 + percent / 100)
    events.onRateChange?.(formatPriceInputValue(nextRate))
  }

  const onChangePercent = (value: string) => {
    if (!value) return
    setRateByDelta(Number(value))
  }

  const onClickPreset = (percent: number) => {
    events.onRatePresetClick?.(`+${percent}%`)
    setRateByDelta(percent)
  }

  return (
    <Stack className="gap-2 rounded-2xl bg-buttonBlack p-4">
      <HStack className="min-h-7 items-center justify-between gap-3">
        <DeltaRate deltaRate={deltaRate} />
        <HStack className="min-w-0 items-center justify-end gap-2">
          <button
            type="button"
            className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-sm font-medium text-primary transition enabled:hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!tradeInfo || loadingTrade}
            onClick={events.onSetMarketRate}
          >
            <Trans>Market</Trans>
          </button>
          <MarketPrice price={tradeInfo} loading={loadingTrade} showInverted={showInvertedRate} numericOnly />
        </HStack>
      </HStack>

      <HStack className="min-h-8 min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <NumericalInput
            maxLength={50}
            className="bg-transparent text-xl font-medium text-primary"
            data-testid="input-selling-rate"
            value={rateValue}
            onUserInput={onRateValueChange}
            onFocus={events.onRateInputFocus}
            onBlur={events.onRateInputBlur}
          />
        </div>
        {quoteCurrency && baseCurrency && (
          <HStack className="min-w-0 shrink-0 items-center gap-1.5">
            <span className="max-w-[160px] shrink-0 truncate text-lg font-medium text-subText">
              {quoteCurrency.symbol}/{baseCurrency.symbol}
            </span>
            <button
              type="button"
              className="flex shrink-0 items-center justify-center text-subText transition hover:brightness-75"
              onClick={() => setShowInvertedRate(value => !value)}
            >
              <Repeat size={14} />
            </button>
          </HStack>
        )}
      </HStack>

      <PercentPresetSelector
        presets={RATE_DELTA_OPTIONS}
        value={percentInputValue}
        normalizeInput={normalizeCustomPercent}
        showPositiveSign
        warnOnNegative
        onChange={onChangePercent}
        onPresetSelect={onClickPreset}
        onCustomBlur={() => events.onRatePresetClick?.('custom')}
      />
    </Stack>
  )
}

export default LimitOrderRateSection
