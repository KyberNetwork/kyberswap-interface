import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useState } from 'react'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'

import { ErrorWarning } from 'components/ErrorWarning'
import { calcInvert, formatPriceInputValue } from 'components/LimitOrder/utils'
import NumericalInput from 'components/NumericalInput'
import PercentPresetSelector from 'components/PercentPresetSelector'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { TriggerDistance } from 'components/StopMarket/TriggerDistance'
import { TRIGGER_PERCENT_PRESETS } from 'components/StopMarket/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useStableCoins } from 'hooks/useTokens'
import { cn } from 'utils/cn'
import { currencyId } from 'utils/currencyId'
import { formatDisplayNumber, formatPercentageInput } from 'utils/numbers'

type Props = {
  sellCurrency?: Currency
  receiveCurrency?: Currency
  triggerPrice: string
  /** Signed distance from the oracle price, in the sell-to-receive direction. */
  triggerPercent?: number
  marketPrice?: number
  isLoadingPrice?: boolean
  onChangeTriggerPrice: (value: string) => void
  onChangeTriggerPercent: (percent: string) => void
  onSetMarketPrice: () => void
  className?: string
}

type HigherOraclePriceWarningProps = Pick<Props, 'sellCurrency' | 'receiveCurrency' | 'triggerPercent'> & {
  onNavigateToLimitOrder?: () => void
}

// A drop of 100% or more puts the trigger at zero or below.
const normalizeCustomPercent = (value: string) => (Number(value) <= -100 ? undefined : value)

export const HigherOraclePriceWarning = ({
  sellCurrency,
  receiveCurrency,
  triggerPercent,
  onNavigateToLimitOrder,
}: HigherOraclePriceWarningProps) => {
  const chainId = sellCurrency?.chainId as ChainId | undefined
  const limitOrderPath =
    chainId && sellCurrency && receiveCurrency
      ? `${APP_PATHS.LIMIT}/${NETWORKS_INFO[chainId].route}/${currencyId(sellCurrency, chainId)}-to-${currencyId(
          receiveCurrency,
          chainId,
        )}`
      : undefined

  if (!((triggerPercent ?? 0) > 0) || !limitOrderPath) return null

  return (
    <ErrorWarning
      type="warn"
      dataTestId="stop-market-higher-trigger-warning"
      title={
        <Trans>
          To set a trigger at a higher price, use{' '}
          <Link to={limitOrderPath} className="text-primary" onClick={onNavigateToLimitOrder}>
            Limit Order
          </Link>
          .
        </Trans>
      }
    />
  )
}

/** Puts the trigger right at the oracle price, with a tooltip saying where that price comes from. */
export const OracleMarketPriceButton = ({
  disabled,
  onClick,
  dataTestId = 'stop-market-market-price-button',
  inverted = false,
}: {
  disabled: boolean
  onClick: () => void
  dataTestId?: string
  inverted?: boolean
}) => (
  <MouseoverTooltip
    placement="top"
    width="280px"
    text={
      inverted ? (
        <Trans>
          Derived from each token&apos;s independent price feed. Your order triggers when this price reaches or rises
          above your level.
        </Trans>
      ) : (
        <Trans>
          Derived from each token&apos;s independent price feed. Your order triggers when this price reaches or falls
          below your level.
        </Trans>
      )
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
 * The price the order triggers at, stored as the receive token per sell token — the direction the oracle
 * quotes the pair in. The field can be shown and edited in either pair direction, like the Limit Order
 * rate field, while the chip row and order payload continue using the canonical oracle direction.
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
  const { isStableCoin } = useStableCoins(sellCurrency?.chainId)
  const defaultInverted =
    !!receiveCurrency && isStableCoin(sellCurrency?.wrapped.address) && !isStableCoin(receiveCurrency.wrapped.address)
  const pairKey = `${sellCurrency?.chainId}:${sellCurrency?.wrapped.address}:${receiveCurrency?.wrapped.address}`
  const [priceDirection, setPriceDirection] = useState<{ pairKey: string; inverted: boolean }>()
  // Follow the stable quote as metadata loads, until the user chooses a direction for this pair.
  const showInvertedPrice = priceDirection?.pairKey === pairKey ? priceDirection.inverted : defaultInverted
  // Like Limit Order, keep the entered inverse alongside its canonical price.
  const [typedInverse, setTypedInverse] = useState<{ value: string; price: string }>()
  const displayedTriggerPrice = showInvertedPrice
    ? typedInverse?.price === triggerPrice
      ? typedInverse.value
      : formatPriceInputValue(Number(triggerPrice) > 0 ? 1 / Number(triggerPrice) : undefined)
    : triggerPrice
  const baseCurrency = showInvertedPrice ? receiveCurrency : sellCurrency
  const quoteCurrency = showInvertedPrice ? sellCurrency : receiveCurrency
  const displayedMarketPrice = showInvertedPrice && marketPrice ? 1 / marketPrice : marketPrice

  const onTriggerPriceInput = (value: string) => {
    const price = showInvertedPrice ? calcInvert(value) : value
    setTypedInverse(showInvertedPrice ? { value, price } : undefined)
    onChangeTriggerPrice(price)
  }

  return (
    <Stack className={cn('gap-2 rounded-2xl bg-buttonBlack p-4', className)} data-testid="stop-market-trigger-section">
      <HStack className="min-h-7 items-center justify-between gap-3">
        <span className="whitespace-nowrap text-sm font-medium text-subText">
          <Trans>Trigger at</Trans>
        </span>
        <HStack className="min-w-0 items-center justify-end gap-2">
          <OracleMarketPriceButton disabled={!marketPrice} inverted={showInvertedPrice} onClick={onSetMarketPrice} />
          {marketPrice ? (
            <span className="min-w-0 truncate text-sm font-medium text-text" data-testid="stop-market-market-rate">
              {formatDisplayNumber(displayedMarketPrice, { significantDigits: 6 })}
            </span>
          ) : isLoadingPrice ? (
            <Skeleton height={20} width={80} />
          ) : null}
        </HStack>
      </HStack>

      <HStack className="min-h-8 min-w-0 items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center">
          <NumericalInput
            maxLength={50}
            className="bg-transparent text-xl font-medium text-primary"
            data-testid="stop-market-trigger-price"
            value={displayedTriggerPrice}
            onUserInput={onTriggerPriceInput}
          />
        </div>
        {quoteCurrency && baseCurrency && (
          <HStack className="min-w-0 shrink-0 items-center gap-1.5">
            <span
              className="max-w-[160px] shrink-0 truncate text-lg font-medium text-subText"
              data-testid="stop-market-trigger-unit"
            >
              {quoteCurrency.symbol}/{baseCurrency.symbol}
            </span>
            <button
              type="button"
              data-testid="stop-market-trigger-invert"
              aria-label={t`Invert price`}
              aria-pressed={showInvertedPrice}
              className="flex shrink-0 items-center justify-center text-subText transition hover:brightness-75"
              onClick={() => setPriceDirection({ pairKey, inverted: !showInvertedPrice })}
            >
              <Repeat size={14} />
            </button>
          </HStack>
        )}
      </HStack>

      <PercentPresetSelector
        presets={TRIGGER_PERCENT_PRESETS}
        value={formatPercentageInput(triggerPercent)}
        normalizeInput={normalizeCustomPercent}
        emptyFocusValue="-"
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
          <Skeleton height={16} width={160} borderRadius={6} />
        </span>
      ) : null}
    </Stack>
  )
}

export default TriggerPriceSection
