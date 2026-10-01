import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'

import NumericalInput from 'components/NumericalInput'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { TRIGGER_PERCENT_PRESETS } from 'components/StopLoss/constants'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  triggerPrice: string
  /** Signed distance from the market price; negative once the trigger is a valid stop-loss. */
  triggerPercent?: number
  marketPrice?: number
  isLoadingPrice?: boolean
  onChangeTriggerPrice: (value: string) => void
  onChangeTriggerPercent: (percent: string) => void
  onSetMarketPrice: () => void
}

const PERCENT_CHIP_CLASSES = 'h-6 rounded-lg border px-2 text-xs font-medium transition-colors'

/** Takes a magnitude — the arrow beside it carries the direction. */
const formatPercentMagnitude = (percent: number) => `${formatDisplayNumber(percent, { fractionDigits: 1 })}%`

/** Editable percent-below-market chip. It and the price field are the same value from two sides. */
const PercentInputChip = ({ percent, onChange }: { percent?: number; onChange: (value: string) => void }) => {
  const [draft, setDraft] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  // A plain numeric string: the field has to round-trip, and formatDisplayNumber blanks negatives.
  const displayValue = isEditing ? draft : percent === undefined ? '' : percent.toFixed(1)

  // Seeded with what is on screen, not the raw float: a preset lands on values like -19.999999999999996,
  // and focusing the chip would otherwise swap the clean label for that.
  useEffect(() => {
    if (!isEditing && percent !== undefined) setDraft(percent.toFixed(1))
  }, [isEditing, percent])

  return (
    <div
      className={cn(
        PERCENT_CHIP_CLASSES,
        'flex w-[82px] items-center',
        percent !== undefined && percent < 0
          ? 'border-primary-50 bg-tabActive text-text'
          : 'border-border/60 text-subText',
      )}
    >
      <NumericalInput
        allowNegative
        maxLength={8}
        className="h-6 bg-transparent p-0 text-xs font-medium"
        data-testid="stop-loss-trigger-percent-input"
        placeholder="0"
        value={displayValue}
        onUserInput={value => {
          // A drop of 100% or more puts the trigger at zero or below, which no price can reach.
          if (Number(value) <= -100) return
          setDraft(value)
          if (value && value !== '-' && !value.endsWith('.')) onChange(value)
        }}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
      />
      <span className="shrink-0">%</span>
    </div>
  )
}

/**
 * Laid out like the limit-order Rate block, so the two forms read alike; the rate shown beside Market
 * is the oracle price the trigger is evaluated against, not the app's USD-ratio price.
 */
const TriggerPriceSection = ({
  sellCurrency,
  receiveCurrency,
  triggerPrice,
  triggerPercent,
  marketPrice,
  isLoadingPrice,
  onChangeTriggerPrice,
  onChangeTriggerPercent,
  onSetMarketPrice,
}: Props) => {
  const isBelowMarket = triggerPercent !== undefined && triggerPercent < 0

  return (
    <Stack className="gap-2 rounded-2xl bg-buttonBlack p-4" data-testid="stop-loss-trigger-section">
      <HStack className="min-h-7 items-center justify-between gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-subText">
          <Trans>Rate</Trans>
        </span>
        <HStack className="min-w-0 items-center justify-end gap-2">
          <button
            type="button"
            data-testid="stop-loss-market-price-button"
            className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-sm font-medium text-primary transition enabled:hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!marketPrice}
            onClick={onSetMarketPrice}
          >
            <Trans>Market</Trans>
          </button>
          {marketPrice && sellCurrency && receiveCurrency ? (
            <span className="min-w-0 truncate text-sm font-medium text-text" data-testid="stop-loss-market-rate">
              1 {sellCurrency.symbol} = {formatDisplayNumber(marketPrice, { significantDigits: 6 })}{' '}
              {receiveCurrency.symbol}
            </span>
          ) : isLoadingPrice ? (
            <Skeleton height={20} width={160} />
          ) : null}
        </HStack>
      </HStack>

      <HStack className="min-h-8 min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <NumericalInput
            maxLength={50}
            className="bg-transparent text-xl font-medium text-primary"
            data-testid="stop-loss-trigger-price"
            value={triggerPrice}
            onUserInput={onChangeTriggerPrice}
          />
        </div>
        {/* Receive token per sell token, written the way the limit-order rate row writes its unit. */}
        {sellCurrency && receiveCurrency && (
          <span className="max-w-[160px] shrink-0 truncate text-lg font-medium text-subText">
            {receiveCurrency.symbol}/{sellCurrency.symbol}
          </span>
        )}
      </HStack>

      <div className="flex flex-wrap items-center gap-1">
        <PercentInputChip percent={triggerPercent} onChange={onChangeTriggerPercent} />
        {TRIGGER_PERCENT_PRESETS.map(percent => (
          <button
            key={percent}
            type="button"
            data-testid={`stop-loss-trigger-percent-preset-${Math.abs(percent)}`}
            className={cn(
              PERCENT_CHIP_CLASSES,
              'border-border/60 text-subText hover:border-border-primary hover:text-primary',
            )}
            onClick={() => onChangeTriggerPercent(String(percent))}
          >
            {percent}%
          </button>
        ))}
      </div>

      {marketPrice ? (
        <HStack className="flex-wrap items-center gap-2 text-xs font-medium text-subText">
          <span data-testid="stop-loss-oracle-price">
            {/* Quoted in the receive token, so it carries that symbol rather than a currency sign. */}
            <Trans>Current oracle price</Trans>: {formatDisplayNumber(marketPrice, { significantDigits: 6 })}{' '}
            {receiveCurrency?.symbol}
          </span>
          {isBelowMarket && (
            <span className="text-red" data-testid="stop-loss-trigger-distance">
              ↓ {formatPercentMagnitude(Math.abs(triggerPercent))} <Trans>below</Trans>
            </span>
          )}
        </HStack>
      ) : isLoadingPrice ? (
        <span className="text-xs font-medium text-subText" data-testid="stop-loss-oracle-price-loading">
          <Trans>Loading the current oracle price…</Trans>
        </span>
      ) : null}
    </Stack>
  )
}

export default TriggerPriceSection
