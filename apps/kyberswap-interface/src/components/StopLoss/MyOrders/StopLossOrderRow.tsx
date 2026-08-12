import { CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useState } from 'react'
import { ExternalLink as LinkIcon, Trash } from 'react-feather'

import { ReactComponent as RecreateIcon } from 'assets/svg/ic_stoploss_recreate.svg'
import IconButton from 'components/Button/IconButton'
import { StopLossRowLayout, StopLossRowWrapper } from 'components/StopLoss/MyOrders/TableHeader'
import {
  AmountCell,
  DistanceCell,
  PairCell,
  StatusCell,
  StopLossFailureDetail,
  formatExpiry,
} from 'components/StopLoss/MyOrders/components'
import { useStopLossOraclePrice } from 'components/StopLoss/hooks/useStopLossOraclePrice'
import { StopLossDisplayStatus, StopLossOrder } from 'components/StopLoss/types'
import {
  getLatestExecution,
  getStopLossDisplayStatus,
  getStopLossExecutionTxHash,
  getStopLossFailureReason,
  getStopLossTriggerPrice,
  resolveExecutionAmountOut,
} from 'components/StopLoss/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import { useCurrencyV2 } from 'hooks/useTokens'
import { ExternalLink } from 'theme'
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
  if (value === undefined || value === '' || Number.isNaN(Number(value))) return '--'
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
  const sellAmount = sellCurrencyAmount ? `${sellCurrencyAmount.toSignificant(6)} ${sellCurrency?.symbol ?? ''}` : '--'

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

  const execution = getLatestExecution(order)
  const executionPrice = execution?.extraData?.oraclePrice
  const receivedAmount = resolveExecutionAmountOut(execution, order.tokenOut, receiveCurrency?.decimals)

  const txHash = getStopLossExecutionTxHash(order)
  const showTxLink = status === StopLossDisplayStatus.EXECUTED && !!txHash

  const isFailed = status === StopLossDisplayStatus.FAILED
  const [showFailureDetail, setShowFailureDetail] = useState(false)
  const recreate = () => onRecreate(order, sellCurrencyAmount?.toExact() ?? '')

  return (
    <StopLossRowWrapper
      layout={isActiveTab ? StopLossRowLayout.ACTIVE : StopLossRowLayout.HISTORY}
      // The id and chain let a test target the exact order it created, which no visible text can do.
      data-testid="stop-loss-order-row"
      data-order-id={order.id}
      data-chain-id={order.chainId}
      className="border-t border-darkBorder px-4 py-3"
    >
      <PairCell sellCurrency={sellCurrency ?? undefined} receiveCurrency={receiveCurrency ?? undefined} />

      <AmountCell
        className="max-sm:col-start-2 max-sm:items-end"
        dataTestId="stop-loss-order-sell-amount"
        value={sellAmount}
        subValue={
          sellAmountUsd ? formatDisplayNumber(sellAmountUsd, { style: 'currency', significantDigits: 4 }) : undefined
        }
      />

      <span
        className="truncate text-sm font-medium text-blue1 max-sm:hidden"
        data-testid="stop-loss-order-trigger-price"
      >
        {formatPairPrice(triggerPrice, receiveCurrency?.symbol)}
      </span>

      {isActiveTab ? (
        <>
          <span
            className="truncate text-sm font-medium text-text max-sm:hidden"
            data-testid="stop-loss-order-current-price"
          >
            {formatPairPrice(currentPrice, receiveCurrency?.symbol)}
          </span>
          <div className="max-sm:hidden">
            <DistanceCell percent={distancePercent} />
          </div>
          <span
            className="truncate text-sm font-medium text-subText max-sm:hidden"
            data-testid="stop-loss-order-expiry"
          >
            {formatExpiry(order.deadline)}
          </span>
        </>
      ) : (
        <>
          <span
            className="truncate text-sm font-medium text-text max-sm:hidden"
            data-testid="stop-loss-order-execution-price"
          >
            {formatPairPrice(executionPrice, receiveCurrency?.symbol)}
          </span>
          <span className="truncate text-sm font-medium text-text max-sm:hidden" data-testid="stop-loss-order-received">
            {receivedAmount === undefined
              ? '--'
              : `${formatDisplayNumber(receivedAmount, { significantDigits: 6 })} ${receiveCurrency?.symbol ?? ''}`}
          </span>
          <div className="max-sm:hidden">
            <StatusCell
              status={status}
              expanded={showFailureDetail}
              onToggle={isFailed ? () => setShowFailureDetail(open => !open) : undefined}
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
            className="flex size-7 items-center justify-center rounded-full text-primary hover:bg-white/10 hover:no-underline"
          >
            <LinkIcon size={15} />
          </ExternalLink>
        ) : (
          <MouseoverTooltip text={t`Recreate order`} placement="top" width="fit-content">
            <IconButton
              onClick={recreate}
              data-testid="stop-loss-order-recreate-button"
              className="p-0 text-subText hover:bg-white/10 hover:text-primary"
            >
              <RecreateIcon className="size-4" />
            </IconButton>
          </MouseoverTooltip>
        )}
      </div>

      {isFailed && showFailureDetail && (
        <StopLossFailureDetail
          sellSymbol={sellCurrency?.symbol || '--'}
          reason={getStopLossFailureReason(order)}
          onRecreate={recreate}
        />
      )}
    </StopLossRowWrapper>
  )
}

export default StopLossOrderRow
