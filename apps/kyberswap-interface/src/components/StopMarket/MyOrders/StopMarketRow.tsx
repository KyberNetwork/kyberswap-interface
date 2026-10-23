import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { AlertTriangle, Edit2, ExternalLink as LinkIcon, Repeat, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stop_market_recreate.svg'
import IconButton from 'components/Button/IconButton'
import { HStack, Stack } from 'components/Stack'
import { StopMarketRowLayout, StopMarketRowWrapper } from 'components/StopMarket/MyOrders/TableHeader'
import {
  AmountCell,
  ChainCell,
  DistanceCell,
  ExpiryCell,
  PairCell,
  RetryingCell,
  StatusCell,
  StopMarketExecutionDetail,
} from 'components/StopMarket/MyOrders/components'
import { useStopMarketCurrency } from 'components/StopMarket/hooks/useStopMarketCurrency'
import { StopMarket, StopMarketDisplayStatus } from 'components/StopMarket/types'
import {
  StopMarketFunding,
  getStopMarketCurrentPrice,
  getStopMarketDisplayStatus,
  getStopMarketExecutionTxHash,
  getStopMarketFills,
  getStopMarketFundingShortfalls,
  getStopMarketMinReceive,
  getStopMarketRetry,
  getStopMarketSellAmountUsd,
  getStopMarketTriggerPrice,
  getStopMarketWarnings,
  summarizeStopMarketFills,
} from 'components/StopMarket/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useTokenPricesWithLoading } from 'state/tokenPrices/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'
import { formatSlippage } from 'utils/slippage'

type Props = {
  order: StopMarket
  isActiveTab: boolean
  isCancelling: boolean
  /** The wallet's balance and allowance for this order's sell token, read by the list per chain. */
  funding?: StopMarketFunding
  /** Position on the page, which staggers the rows' entrance. */
  rowIndex?: number
  onCancel: (order: StopMarket) => void
  onEdit: (order: StopMarket) => void
  /** `sellAmount` is exact, not the rounded display figure — it goes straight back into the form. */
  onRecreate: (order: StopMarket, sellAmount: string) => void
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

const StopMarketRow = ({
  order,
  isActiveTab,
  isCancelling,
  funding,
  rowIndex = 0,
  onCancel,
  onEdit,
  onRecreate,
}: Props) => {
  const sellCurrency = useStopMarketCurrency(order.tokenInInfo, order.chainId)
  const receiveCurrency = useStopMarketCurrency(order.tokenOutInfo, order.chainId)

  const status = getStopMarketDisplayStatus(order)
  const triggerPrice = getStopMarketTriggerPrice(order)

  const sellCurrencyAmount = CurrencyAmount.fromRawAmount(sellCurrency, order.amountIn)
  const sellAmount = `${sellCurrencyAmount.toSignificant(6)} ${sellCurrency.symbol ?? ''}`

  // The order values itself while open (by the oracle) and once executed (by the settlement). Only a
  // cancelled or expired one has no figure, and is priced once by the price service for its own chain.
  const ownSellAmountUsd = getStopMarketSellAmountUsd(order)
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
  const currentPrice = getStopMarketCurrentPrice(order)
  const distancePercent =
    currentPrice && Number(triggerPrice) ? ((Number(triggerPrice) - currentPrice) / currentPrice) * 100 : undefined

  // Every fill counts towards the execution price and the received total, however many the order took.
  const fills = getStopMarketFills(order)
  const isExecuted = status === StopMarketDisplayStatus.EXECUTED
  const fillSummary = summarizeStopMarketFills(
    fills,
    // An executed order sold all of it, so its own amount is the exact total.
    isExecuted ? Number(sellCurrencyAmount.toExact()) : undefined,
  )
  const executionPrice = fillSummary.price
  const receivedAmount = fillSummary.received

  const txHash = getStopMarketExecutionTxHash(order)
  const showTxLink = isExecuted && !!txHash
  // What the service says about the order, then what the wallet says: an open order whose sell token
  // or allowance has since fallen short will fail when it fires, and the wallet is the first to know.
  const fundingShortfalls =
    isActiveTab && funding ? getStopMarketFundingShortfalls(order.amountIn, funding.balance, funding.allowance) : []

  /**
   * The trigger was reached and the swap has not gone through. The revert reason names the cause when it
   * can; when it does not, a shortfall the wallet shows right now is the likeliest one. The note takes
   * over from the funding warnings, which would say the same thing again.
   */
  const retry = isActiveTab ? getStopMarketRetry(order) : undefined
  const retryCause =
    retry && retry.cause === 'unknown'
      ? fundingShortfalls.includes('balance')
        ? 'balance'
        : fundingShortfalls.includes('allowance')
        ? 'allowance'
        : 'unknown'
      : retry?.cause
  const balanceShort =
    funding?.balance !== undefined && funding.balance < BigInt(order.amountIn)
      ? CurrencyAmount.fromRawAmount(sellCurrency, (BigInt(order.amountIn) - funding.balance).toString()).toSignificant(
          6,
        )
      : undefined
  const sellSymbol = sellCurrency.symbol ?? ''
  const maxSlippage = formatSlippage(order.slippage)
  const retryMessage =
    retryCause === 'slippage'
      ? t`Trigger price reached, but your ${maxSlippage} max slippage is too tight for current market conditions. Still retrying — raise your slippage to fill sooner.`
      : retryCause === 'balance'
      ? balanceShort
        ? t`Trigger price reached, but your balance is short. You need ${balanceShort} more ${sellSymbol} — still retrying, so the order will fill once your balance is topped up.`
        : t`Trigger price reached, but your balance is short — still retrying, so the order will fill once your balance is topped up.`
      : retryCause === 'allowance'
      ? t`Trigger price reached, but your ${sellSymbol} approval is too low — still retrying, so the order will fill once it is raised.`
      : retryCause === 'unknown'
      ? t`Trigger price reached but the order hasn't filled yet. Still retrying.`
      : undefined

  const warnings = [
    ...getStopMarketWarnings(order).map(warning => ({ code: warning.code, message: warning.message })),
    ...(retry
      ? []
      : fundingShortfalls.map(shortfall =>
          shortfall === 'balance'
            ? { code: 'INSUFFICIENT_BALANCE', message: t`Insufficient balance — order may fail` }
            : { code: 'INSUFFICIENT_ALLOWANCE', message: t`Insufficient allowance — order may fail` },
        )),
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
      data-testid="stop-market-order-row"
      data-order-id={order.id}
      data-chain-id={order.chainId}
      // Rows rise in one after another when they first mount — a new page, tab or filter — and keep
      // still through the 10s poll, which updates them in place. The delay is capped so a full page has
      // landed within 0.6s.
      className={cn(
        // `duration-*` also sets the animation's length under tailwindcss-animate, so the background
        // transition takes its 200ms from a plain property instead.
        'animate-[fadeInUp_0.3s_ease-out_both] transition-colors [transition-duration:200ms] motion-reduce:animate-none',
        // A warned or retrying row is tinted whole, so the note under it reads as part of the order.
        (warnings.length > 0 || !!retryMessage) && 'bg-warning-10',
        expanded && canExpand && 'bg-raisedBlack',
      )}
      style={{ animationDelay: `${Math.min(rowIndex * 50, 300)}ms` }}
    >
      {/* Dimmed on the grid, not the row: the entrance animation holds the row's own opacity. */}
      <StopMarketRowWrapper
        layout={isActiveTab ? StopMarketRowLayout.ACTIVE : StopMarketRowLayout.HISTORY}
        className={cn('min-h-14 px-4 py-2 transition-opacity duration-200', isCancelling && 'opacity-50')}
      >
        <ChainCell chainId={order.chainId} />

        <PairCell sellCurrency={sellCurrency} receiveCurrency={receiveCurrency} />

        <AmountCell
          className="max-sm:col-start-3 max-sm:items-end"
          dataTestId="stop-market-order-sell-amount"
          value={sellAmount}
          isSubLoading={isServicePriceLoading}
          subValue={
            sellAmountUsd ? formatDisplayNumber(sellAmountUsd, { style: 'currency', significantDigits: 4 }) : undefined
          }
        />

        <Stack className="min-w-0 gap-0.5 font-medium max-sm:hidden">
          <span className="truncate text-sm text-blue3" data-testid="stop-market-order-trigger-price">
            {formatPairPrice(triggerPrice, receiveCurrency.symbol)}
          </span>
          <span className="truncate text-xs text-subText" data-testid="stop-market-order-slippage">
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
                  data-testid="stop-market-order-invert-price"
                  className="flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0 text-subText hover:text-text"
                >
                  <Repeat size={12} />
                </button>
              </HStack>
              <span className="truncate text-sm text-primary" data-testid="stop-market-order-current-price">
                {formatPairPrice(isPriceInverted && currentPrice ? 1 / currentPrice : currentPrice)}
              </span>
            </Stack>
            <div className="max-sm:hidden">{retry ? <RetryingCell /> : <DistanceCell percent={distancePercent} />}</div>
            <div className="max-sm:hidden">
              <ExpiryCell deadline={order.deadline} />
            </div>
          </>
        ) : (
          <>
            <span
              className="truncate text-sm font-medium text-text max-sm:hidden"
              data-testid="stop-market-order-execution-price"
            >
              {formatPairPrice(executionPrice, receiveCurrency.symbol)}
            </span>
            <span
              className="truncate text-sm font-medium text-text max-sm:hidden"
              data-testid="stop-market-order-received"
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

        <div className="flex justify-end gap-1">
          {isActiveTab ? (
            <>
              <MouseoverTooltip text={t`Edit order`} placement="top" width="fit-content">
                <IconButton
                  disabled={isCancelling}
                  onClick={() => onEdit(order)}
                  data-testid="stop-market-order-edit-button"
                  className="p-0 text-subText hover:bg-white/10 hover:text-text disabled:text-subText-40 disabled:opacity-100"
                >
                  <Edit2 size={15} />
                </IconButton>
              </MouseoverTooltip>
              <MouseoverTooltip text={t`Cancel order`} placement="top" width="fit-content">
                <IconButton
                  disabled={isCancelling}
                  onClick={() => onCancel(order)}
                  data-testid="stop-market-order-cancel-button"
                  className="p-0 text-subText hover:bg-white/10 hover:text-red disabled:text-subText-40 disabled:opacity-100"
                >
                  <Trash size={16} />
                </IconButton>
              </MouseoverTooltip>
            </>
          ) : showTxLink ? (
            <ExternalLink
              href={getEtherscanLink(order.chainId, txHash as string, 'transaction')}
              data-testid="stop-market-order-tx-link"
              className="flex size-7 items-center justify-center rounded-full text-subText hover:bg-white/10 hover:text-text hover:no-underline"
            >
              <LinkIcon size={15} />
            </ExternalLink>
          ) : (
            <MouseoverTooltip text={t`Recreate order`} placement="top" width="fit-content">
              <IconButton
                onClick={recreate}
                data-testid="stop-market-order-recreate-button"
                className="p-0 text-primary hover:bg-white/10 hover:brightness-110"
              >
                <RecreateIcon className="size-4" />
              </IconButton>
            </MouseoverTooltip>
          )}
        </div>
      </StopMarketRowWrapper>

      {retryMessage && (
        // Default text colour: the amber cell already carries the signal, and an amber explanation would
        // make an order that is still being worked on read as alarming.
        <HStack
          className="items-center justify-between gap-4 px-4 pb-2.5 max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:px-3"
          data-testid="stop-market-order-retry-message"
          data-cause={retryCause}
        >
          <p className="m-0 min-w-0 flex-1 text-xs text-text">{retryMessage}</p>
          {/* Slippage is the one cause the order itself can fix. */}
          {retryCause === 'slippage' && !isCancelling && (
            <button
              type="button"
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-0 bg-primary-10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-20"
              onClick={() => onEdit(order)}
              data-testid="stop-market-order-retry-edit"
            >
              <Edit2 size={12} />
              {t`Edit Order`}
            </button>
          )}
        </HStack>
      )}

      {warnings.length > 0 && (
        <Stack className="gap-1 px-4 pb-2.5 max-sm:px-3" data-testid="stop-market-order-warnings">
          {warnings.map((warning, index) => (
            <HStack
              key={`${warning.code}-${index}`}
              className="items-start gap-1.5 text-xs italic text-warning"
              data-testid="stop-market-order-warning"
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
            <StopMarketExecutionDetail
              chainId={order.chainId}
              fills={fills}
              summary={fillSummary}
              sellSymbol={sellCurrency.symbol || '-'}
              receiveSymbol={receiveCurrency.symbol || '-'}
              triggerPrice={Number(triggerPrice)}
              minAmountOut={getStopMarketMinReceive({
                estimatedOutput: Number(sellCurrencyAmount.toExact()) * Number(triggerPrice),
                slippage: order.slippage,
              })}
              createdAt={order.createdAt}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default StopMarketRow
