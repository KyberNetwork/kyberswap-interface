import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stoploss_recreate.svg'
import IconButton from 'components/Button/IconButton'
import { Stack } from 'components/Stack'
import { StopLossRowLayout, StopLossRowWrapper } from 'components/StopLoss/MyOrders/TableHeader'
import {
  AmountCell,
  ChainCell,
  DistanceCell,
  ExpiryCell,
  PairCell,
  StatusCell,
  StopLossExecutionDetail,
  StopLossFailureDetail,
} from 'components/StopLoss/MyOrders/components'
import { useStopLossOraclePrice } from 'components/StopLoss/hooks/useStopLossOraclePrice'
import { StopLossDisplayStatus, StopLossOrder } from 'components/StopLoss/types'
import {
  getStopLossDisplayStatus,
  getStopLossExecutionTxHash,
  getStopLossFailureReason,
  getStopLossFills,
  getStopLossTriggerPrice,
  summarizeStopLossFills,
} from 'components/StopLoss/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useCurrencyV2 } from 'hooks/useTokens'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { getEtherscanLink } from 'utils/explorer'
import { formatDisplayNumber } from 'utils/numbers'

type Props = {
  order: StopLossOrder
  isActiveTab: boolean
  /** USD prices for the sell-amount sub-line; absent when the row sits outside the priced chain. */
  priceUsd?: Record<string, number>
  isCancelling: boolean
  onCancel: (order: StopLossOrder) => void
  /** `sellAmount` is exact, not the rounded display figure — it goes straight back into the form. */
  onRecreate: (order: StopLossOrder, sellAmount: string) => void
}

/**
 * Prices here are tokenOut per tokenIn, not USD, so they carry the quote symbol instead of a currency
 * sign — a pair like WETH/WBTC has no dollar meaning at all.
 */
const formatPairPrice = (value: number | string | undefined, quoteSymbol?: string) => {
  if (value === undefined || value === '' || Number.isNaN(Number(value))) return '-'
  const amount = formatDisplayNumber(value, { significantDigits: 6 })
  return quoteSymbol ? `${amount} ${quoteSymbol}` : amount
}

const StopLossOrderRow = ({ order, isActiveTab, priceUsd, isCancelling, onCancel, onRecreate }: Props) => {
  const sellCurrency = useCurrencyV2(order.tokenIn, order.chainId)
  const receiveCurrency = useCurrencyV2(order.tokenOut, order.chainId)

  const status = getStopLossDisplayStatus(order)
  const triggerPrice = getStopLossTriggerPrice(order)

  // Without the token's decimals `amountIn` is an unreadable integer, and pricing it would be wrong by
  // 10^decimals — so an unresolved token shows no amount rather than a misleading one.
  const sellCurrencyAmount = sellCurrency ? CurrencyAmount.fromRawAmount(sellCurrency, order.amountIn) : undefined
  const sellAmount = sellCurrencyAmount ? `${sellCurrencyAmount.toSignificant(6)} ${sellCurrency?.symbol ?? ''}` : '-'

  const sellPriceUsd = priceUsd?.[order.tokenIn.toLowerCase()]
  const sellAmountUsd =
    sellCurrencyAmount && sellPriceUsd ? Number(sellCurrencyAmount.toExact()) * sellPriceUsd : undefined

  // The same feed the trigger is evaluated against, queried per pair so rows on any chain are right.
  // History rows never render a live price, so they do not open a subscription for it.
  const { priceNumber: currentPrice } = useStopLossOraclePrice(
    isActiveTab ? sellCurrency ?? undefined : undefined,
    isActiveTab ? receiveCurrency ?? undefined : undefined,
    order.chainId,
  )
  const distancePercent =
    currentPrice && Number(triggerPrice) ? ((Number(triggerPrice) - currentPrice) / currentPrice) * 100 : undefined

  // Every fill counts towards the execution price and the received total, however many the order took.
  const fills = getStopLossFills(order, sellCurrency?.decimals, receiveCurrency?.decimals)
  const isExecuted = status === StopLossDisplayStatus.EXECUTED
  const fillSummary = summarizeStopLossFills(
    fills,
    // An executed order sold all of it, so its own amount is the exact total.
    isExecuted && sellCurrencyAmount ? Number(sellCurrencyAmount.toExact()) : undefined,
  )
  const executionPrice = fillSummary.price
  const receivedAmount = fillSummary.amountOut

  const txHash = getStopLossExecutionTxHash(order)
  const showTxLink = isExecuted && !!txHash

  const isFailed = status === StopLossDisplayStatus.FAILED
  // An executed row only has a story to tell once its fills carry both their prices and what they received.
  const hasExecutionDetail = isExecuted && executionPrice !== undefined && receivedAmount !== undefined
  const canExpand = isFailed || hasExecutionDetail
  const [expanded, setExpanded] = useState(false)
  const recreate = () => onRecreate(order, sellCurrencyAmount?.toExact() ?? '')

  return (
    <div
      // The id and chain let a test target the exact order it created, which no visible text can do.
      data-testid="stop-loss-order-row"
      data-order-id={order.id}
      data-chain-id={order.chainId}
      className={cn('transition-colors duration-200', expanded && canExpand && 'bg-raisedBlack')}
    >
      <StopLossRowWrapper
        layout={isActiveTab ? StopLossRowLayout.ACTIVE : StopLossRowLayout.HISTORY}
        className="min-h-14 px-4 py-2"
      >
        <ChainCell chainId={order.chainId} />

        <PairCell sellCurrency={sellCurrency ?? undefined} receiveCurrency={receiveCurrency ?? undefined} />

        <AmountCell
          className="max-sm:col-start-3 max-sm:items-end"
          dataTestId="stop-loss-order-sell-amount"
          value={sellAmount}
          subValue={
            sellAmountUsd ? formatDisplayNumber(sellAmountUsd, { style: 'currency', significantDigits: 4 }) : undefined
          }
        />

        <span
          className="truncate text-sm font-medium text-blue3 max-sm:hidden"
          data-testid="stop-loss-order-trigger-price"
        >
          {formatPairPrice(triggerPrice, receiveCurrency?.symbol)}
        </span>

        {isActiveTab ? (
          <>
            {/* The pair names the unit, so the price itself needs none. */}
            <Stack className="min-w-0 gap-0.5 font-medium max-sm:hidden">
              <span className="truncate text-xs text-subText">
                {sellCurrency?.symbol || '-'}/{receiveCurrency?.symbol || '-'}
              </span>
              <span className="truncate text-sm text-text" data-testid="stop-loss-order-current-price">
                {formatPairPrice(currentPrice)}
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
              data-testid="stop-loss-order-execution-price"
            >
              {formatPairPrice(executionPrice, receiveCurrency?.symbol)}
            </span>
            <span
              className="truncate text-sm font-medium text-text max-sm:hidden"
              data-testid="stop-loss-order-received"
            >
              {receivedAmount === undefined
                ? '-'
                : `${formatDisplayNumber(receivedAmount, { significantDigits: 6 })} ${receiveCurrency?.symbol ?? ''}`}
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
                data-testid="stop-loss-order-cancel-button"
                className="p-0 text-subText hover:bg-white/10 hover:text-red disabled:text-subText-40 disabled:opacity-100"
              >
                <Trash size={16} />
              </IconButton>
            </MouseoverTooltip>
          ) : showTxLink ? (
            <ExternalLink
              href={getEtherscanLink(order.chainId, txHash as string, 'transaction')}
              data-testid="stop-loss-order-tx-link"
              className="flex size-7 items-center justify-center rounded-full text-subText hover:bg-white/10 hover:text-text hover:no-underline"
            >
              <LinkIcon size={15} />
            </ExternalLink>
          ) : (
            <MouseoverTooltip text={t`Recreate order`} placement="top" width="fit-content">
              <IconButton
                onClick={recreate}
                data-testid="stop-loss-order-recreate-button"
                className="p-0 text-primary hover:bg-white/10 hover:brightness-110"
              >
                <RecreateIcon className="size-4" />
              </IconButton>
            </MouseoverTooltip>
          )}
        </div>
      </StopLossRowWrapper>

      {/* Kept mounted so it can animate both ways; `inert` keeps the hidden Recreate button out of the tab
          order while it is collapsed. */}
      {canExpand && (
        <div
          inert={!expanded}
          className={cn(
            'grid transition-[grid-template-rows,opacity] duration-200 ease-in-out',
            expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="min-h-0 overflow-hidden">
            {isFailed ? (
              <StopLossFailureDetail
                sellSymbol={sellCurrency?.symbol || '-'}
                reason={getStopLossFailureReason(order)}
                onRecreate={recreate}
              />
            ) : (
              <StopLossExecutionDetail
                chainId={order.chainId}
                fills={fills}
                summary={fillSummary}
                sellSymbol={sellCurrency?.symbol || '-'}
                receiveSymbol={receiveCurrency?.symbol || '-'}
                triggerPrice={Number(triggerPrice)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default StopLossOrderRow
