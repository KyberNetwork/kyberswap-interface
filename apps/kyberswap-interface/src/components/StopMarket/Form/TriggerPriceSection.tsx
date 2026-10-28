import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'

import NumericalInput from 'components/NumericalInput'
import PercentPresetSelector from 'components/PercentPresetSelector'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { TriggerDistance } from 'components/StopMarket/TriggerDistance'
import { TRIGGER_PERCENT_PRESETS } from 'components/StopMarket/constants'
import { formatTriggerPercentValue } from 'components/StopMarket/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  triggerPrice: string
  /** Signed distance from the market price; negative once the trigger is a valid stop market order. */
  triggerPercent?: number
  marketPrice?: number
  isLoadingPrice?: boolean
  onChangeTriggerPrice: (value: string) => void
  onChangeTriggerPercent: (percent: string) => void
  onSetMarketPrice: () => void
  className?: string
}

// A drop of 100% or more puts the trigger at zero or below.
const normalizeCustomPercent = (value: string) => (Number(value) <= -100 ? undefined : value)

/** Puts the trigger right at the oracle price, with a tooltip saying where that price comes from. */
export const OracleMarketPriceButton = ({
  disabled,
  onClick,
  dataTestId = 'stop-market-market-price-button',
}: {
  disabled: boolean
  onClick: () => void
  dataTestId?: string
}) => (
  <MouseoverTooltip
    placement="top"
    width="280px"
    text={
      <Trans>
        Derived from each token&apos;s independent price feed. Your order triggers when this price reaches your level.
      </Trans>
    }
  >
    {/* Disabled, it lets the pointer through, so the tooltip's wrapper still sees the hover — a disabled
        button swallows mouse events in some browsers. */}
    <button
      type="button"
      data-testid={dataTestId}
      className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-sm font-medium text-primary transition enabled:hover:brightness-90 disabled:pointer-events-none disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
    >
      <Trans>Oracle</Trans>
    </button>
  </MouseoverTooltip>
)

/**
 * The price the order triggers at, typed as the receive token per sell token — the direction the oracle
 * quotes the pair in. The rate beside Oracle is that feed's price, not the app's USD-ratio price, and the
 * chip row sets the trigger as a distance from it.
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
  className,
}: Props) => {
  const sellSymbol = sellCurrency?.symbol
  const receiveSymbol = receiveCurrency?.symbol

  return (
    <Stack className={cn('gap-2 rounded-2xl bg-buttonBlack p-4', className)} data-testid="stop-market-trigger-section">
      <HStack className="min-h-7 items-center justify-between gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-subText">
          <Trans>Trigger at</Trans>
        </span>
        <HStack className="min-w-0 items-center justify-end gap-2">
          <OracleMarketPriceButton disabled={!marketPrice} onClick={onSetMarketPrice} />
          {marketPrice ? (
            <span className="min-w-0 truncate text-sm font-medium text-text" data-testid="stop-market-market-rate">
              {formatDisplayNumber(marketPrice, { significantDigits: 6 })}
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
            data-testid="stop-market-trigger-price"
            value={triggerPrice}
            onUserInput={onChangeTriggerPrice}
          />
        </div>
        {sellSymbol && receiveSymbol && (
          <span
            className="max-w-[200px] shrink-0 truncate text-lg font-medium text-subText"
            data-testid="stop-market-trigger-unit"
          >
            <Trans>
              {receiveSymbol} per {sellSymbol}
            </Trans>
          </span>
        )}
      </HStack>

      <PercentPresetSelector
        presets={TRIGGER_PERCENT_PRESETS}
        value={triggerPercent === undefined ? '' : formatTriggerPercentValue(triggerPercent)}
        normalizeInput={normalizeCustomPercent}
        colorByDirection
        testIdPrefix="stop-market-trigger-percent"
        onChange={value => {
          if (value) onChangeTriggerPercent(value)
        }}
        onPresetSelect={percent => onChangeTriggerPercent(String(percent))}
      />

      {marketPrice ? (
        <TriggerDistance
          percent={triggerPercent}
          className="text-xs font-medium"
          dataTestId="stop-market-trigger-distance"
        />
      ) : isLoadingPrice ? (
        // Boxed at the text-xs line the distance takes, so it lands without moving the card.
        <span className="flex h-4 items-center" data-testid="stop-market-oracle-price-loading">
          <Skeleton height={10} width={220} borderRadius={6} />
        </span>
      ) : null}
    </Stack>
  )
}

export default TriggerPriceSection
