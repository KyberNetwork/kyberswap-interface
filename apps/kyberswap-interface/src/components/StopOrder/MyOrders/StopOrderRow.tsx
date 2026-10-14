import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { AlertTriangle, ExternalLink as LinkIcon, Repeat, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stop_order_recreate.svg'
import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import { StopOrderRowLayout, StopOrderRowWrapper } from 'components/StopOrder/MyOrders/TableHeader'
import {
  AmountCell,
  ChainCell,
  DistanceCell,
  ExpiryCell,
  PairCell,
  StatusCell,
  StopOrderExecutionDetail,
} from 'components/StopOrder/MyOrders/components'
import { useStopOrderCurrency } from 'components/StopOrder/hooks/useStopOrderCurrency'
import { useStopOrderFunding } from 'components/StopOrder/hooks/useStopOrderFunding'
import { StopOrder, StopOrderDisplayStatus } from 'components/StopOrder/types'
import {
  getStopOrderCurrentPrice,
  getStopOrderDisplayStatus,
  getStopOrderExecutionTxHash,
  getStopOrderFills,
  getStopOrderSellAmountUsd,
  getStopOrderTriggerPrice,
  getStopOrderWarnings,
  summarizeStopOrderFills,
} from 'components/StopOrder/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

type Props = {
  order: StopOrder
  isActiveTab: boolean
  isCancelling: boolean
  /** Position on the page, which staggers the rows' entrance. */
  rowIndex?: number
  onCancel: (order: StopOrder) => void
  /** `sellAmount` is exact, not the rounded display figure — it goes straight back into the form. */
  onRecreate: (order: StopOrder, sellAmount: string) => void
}

const NO_ADDRESSES: string[] = []

/**
 * Prices here are tokenOut per tokenIn, not USD, so they carry the quote symbol instead of a currency
 * sign — a pair like WETH/WBTC has no dollar meaning at all.
 */
const formatPairPrice = (value: number | string | undefined, quoteSymbol?: string) => {
  if (value === undefined || value === '' || Number.isNaN(Number(value))) return '-'
  const amount = formatDisplayNumber(value, { significantDigits: 6 })
  return quoteSymbol ? `${amount} ${quoteSymbol}` : amount
}

const StopOrderRow = ({ order, isActiveTab, isCancelling, rowIndex = 0, onCancel, onRecreate }: Props) => {
  const sellCurrency = useStopOrderCurrency(order.tokenInInfo, order.chainId)
  const receiveCurrency = useStopOrderCurrency(order.tokenOutInfo, order.chainId)

  const status = getStopOrderDisplayStatus(order)
  const triggerPrice = getStopOrderTriggerPrice(order)

  const sellCurrencyAmount = CurrencyAmount.fromRawAmount(sellCurrency, order.amountIn)
  const sellAmount = `${sellCurrencyAmount.toSignificant(6)} ${sellCurrency.symbol ?? ''}`

  // The order values itself while open (by the oracle) and once executed (by the settlement). Only a
  // cancelled or expired one has no figure, and is priced once by the price service for its own chain.
  const ownSellAmountUsd = getStopOrderSellAmountUsd(order)
  const { data: servicePrices, loading: isServicePriceLoading } = useTokenPricesWithLoading(
    ownSellAmountUsd === undefined ? [order.tokenIn] : NO_ADDRESSES,
    order.chainId,
    { refresh: 'once' },
  )
  const servicePriceUsd = servicePrices[order.tokenIn.toLowerCase()]
  const sellAmountUsd =
    ownSellAmountUsd ?? (servicePriceUsd ? Number(sellCurrencyAmount.toExact()) * servicePriceUsd : undefined)

  // The feed the trigger is checked against, as the service read it when it served the list, which the
  // list's own poll keeps fresh.
  const currentPrice = getStopOrderCurrentPrice(order)
  const distancePercent =
    currentPrice && Number(triggerPrice) ? ((Number(triggerPrice) - currentPrice) / currentPrice) * 100 : undefined

  // Every fill counts towards the execution price and the received total, however many the order took.
  const fills = getStopOrderFills(order)
  const isExecuted = status === StopOrderDisplayStatus.EXECUTED
  const fillSummary = summarizeStopOrderFills(
    fills,
    // An executed order sold all of it, so its own amount is the exact total.
    isExecuted ? Number(sellCurrencyAmount.toExact()) : undefined,
  )
  const executionPrice = fillSummary.price
  const receivedAmount = fillSummary.amountOut

  const txHash = getStopOrderExecutionTxHash(order)
  const showTxLink = isExecuted && !!txHash
  // What the service says about the order, then what the wallet says: an open order whose sell token
  // or allowance has since fallen short will fail when it fires, and the wallet is the first to know.
  const fundingShortfalls = useStopOrderFunding(order, sellCurrency, isActiveTab)
  const warnings = [
    ...getStopOrderWarnings(order).map(warning => ({ code: warning.code, message: warning.message })),
    ...fundingShortfalls.map(shortfall =>
      shortfall === 'balance'
        ? { code: 'INSUFFICIENT_BALANCE', message: t`Insufficient balance — order may fail` }
        : { code: 'INSUFFICIENT_ALLOWANCE', message: t`Insufficient allowance — order may fail` },
    ),
  ]

  // An executed row only has a story to tell once its fills carry both their prices and what they received.
  const canExpand = isExecuted && executionPrice !== undefined && receivedAmount !== undefined
  const [expanded, setExpanded] = useState(false)
  // Display only: the trigger and distance stay in the order's own direction.
  const [isPriceInverted, setIsPriceInverted] = useState(false)
  const recreate = () => onRecreate(order, sellCurrencyAmount.toExact())

  return (
    <div
      // The id and chain let a test target the exact order it created, which no visible text can do.
      data-testid="stop-order-order-row"
      data-order-id={order.id}
      data-chain-id={order.chainId}
      // Rows rise in one after another when they first mount — a new page, tab or filter — and keep
      // still through the 10s poll, which updates them in place. The delay is capped so a full page has
      // landed within 0.6s.
      className={cn(
        // `duration-*` also sets the animation's length under tailwindcss-animate, so the background
        // transition takes its 200ms from a plain property instead.
        'animate-[fadeInUp_0.3s_ease-out_both] transition-colors [transition-duration:200ms] motion-reduce:animate-none',
        // A warned row is tinted whole, so the note under it reads as part of the order.
        warnings.length > 0 && 'bg-warning-10',
        expanded && canExpand && 'bg-raisedBlack',
      )}
      style={{ animationDelay: `${Math.min(rowIndex * 50, 300)}ms` }}
    >
      {/* Dimmed on the grid, not the row: the entrance animation holds the row's own opacity. */}
      <StopOrderRowWrapper
        layout={isActiveTab ? StopOrderRowLayout.ACTIVE : StopOrderRowLayout.HISTORY}
        className={cn('min-h-14 px-4 py-2 transition-opacity duration-200', isCancelling && 'opacity-50')}
      >
        <ChainCell chainId={order.chainId} />

        <PairCell sellCurrency={sellCurrency} receiveCurrency={receiveCurrency} />

        <AmountCell
          className="max-sm:col-start-3 max-sm:items-end"
          dataTestId="stop-order-order-sell-amount"
          value={sellAmount}
          isSubLoading={isServicePriceLoading}
          subValue={
            sellAmountUsd ? formatDisplayNumber(sellAmountUsd, { style: 'currency', significantDigits: 4 }) : undefined
          }
        />

        <Stack className="min-w-0 gap-0.5 font-medium max-sm:hidden">
          <span className="truncate text-sm text-blue3" data-testid="stop-order-order-trigger-price">
            {formatPairPrice(triggerPrice, receiveCurrency.symbol)}
          </span>
          <span className="truncate text-xs text-subText" data-testid="stop-order-order-slippage">
            {formatSlippage(order.slippage)}
          </span>
        </Stack>

        {isActiveTab ? (
          <>
            {/* The pair names the unit, so the price itself needs none. */}
            <Stack className="min-w-0 gap-0.5 font-medium max-sm:hidden">
              <HStack className="min-w-0 items-center gap-1 text-xs text-subText">
                <span className="truncate">
                  {isPriceInverted
                    ? `${receiveCurrency.symbol || '-'}/${sellCurrency.symbol || '-'}`
                    : `${sellCurrency.symbol || '-'}/${receiveCurrency.symbol || '-'}`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPriceInverted(inverted => !inverted)}
                  aria-label={t`Invert price`}
                  data-testid="stop-order-order-invert-price"
                  className="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0 text-subText hover:text-text"
                >
                  <Repeat size={12} />
                </button>
              </HStack>
              <span className="truncate text-sm text-primary" data-testid="stop-order-order-current-price">
                {formatPairPrice(isPriceInverted && currentPrice ? 1 / currentPrice : currentPrice)}
              </span>
            </Stack>
            <div className="max-sm:hidden">
              <DistanceCell percent={distancePercent} />
            </div>
            <div className="max-sm:hidden">
              <ExpiryCell deadline={order.deadline} />
            </div>
          </>
        ) : (
          <>
            <span
              className="truncate text-sm font-medium text-text max-sm:hidden"
              data-testid="stop-order-order-execution-price"
            >
              {formatPairPrice(executionPrice, receiveCurrency.symbol)}
            </span>
            <span
              className="truncate text-sm font-medium text-text max-sm:hidden"
              data-testid="stop-order-order-received"
            >
              {receivedAmount === undefined
                ? '-'
                : `${formatDisplayNumber(receivedAmount, { significantDigits: 6 })} ${receiveCurrency.symbol ?? ''}`}
            </span>
            <div className="max-sm:hidden">
              <StatusCell
                status={status}
                expanded={expanded}
                onToggle={canExpand ? () => setExpanded(open => !open) : undefined}
              />
            </div>
          </>
        )}

        <div className="flex justify-end">
          {isActiveTab ? (
            <MouseoverTooltip text={t`Cancel order`} placement="top" width="fit-content">
              <IconButton
                disabled={isCancelling}
                onClick={() => onCancel(order)}
                data-testid="stop-order-order-cancel-button"
                className="p-0 text-subText hover:bg-white/10 hover:text-red disabled:text-subText-40 disabled:opacity-100"
              >
                <Trash size={16} />
              </IconButton>
            </MouseoverTooltip>
          ) : showTxLink ? (
            <ExternalLink
              href={getEtherscanLink(order.chainId, txHash as string, 'transaction')}
              data-testid="stop-order-order-tx-link"
              className="flex size-7 items-center justify-center rounded-full text-subText hover:bg-white/10 hover:text-text hover:no-underline"
            >
              <LinkIcon size={15} />
            </ExternalLink>
          ) : (
            <MouseoverTooltip text={t`Recreate order`} placement="top" width="fit-content">
              <IconButton
                onClick={recreate}
                data-testid="stop-order-order-recreate-button"
                className="p-0 text-primary hover:bg-white/10 hover:brightness-110"
              >
                <RecreateIcon className="size-4" />
              </IconButton>
            </MouseoverTooltip>
          )}
        </div>
      </StopOrderRowWrapper>

      {warnings.length > 0 && (
        <Stack className="gap-1 px-4 pb-2.5 max-sm:px-3" data-testid="stop-order-order-warnings">
          {warnings.map((warning, index) => (
            <HStack
              key={`${warning.code}-${index}`}
              className="items-start gap-1.5 text-xs italic text-warning"
              data-testid="stop-order-order-warning"
              data-code={warning.code}
            >
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>{warning.message}</span>
            </HStack>
          ))}
        </Stack>
      )}

      {/* Kept mounted so it can animate both ways; `inert` keeps the hidden transaction links out of the
          tab order while it is collapsed. */}
      {canExpand && (
        <div
          inert={!expanded}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <StopOrderExecutionDetail
              chainId={order.chainId}
              fills={fills}
              summary={fillSummary}
              sellSymbol={sellCurrency.symbol || '-'}
              receiveSymbol={receiveCurrency.symbol || '-'}
              triggerPrice={Number(triggerPrice)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StopOrderRow
