import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import {
  calcPercentFilledOrder,
  calcRate,
  formatAmountOrder,
  formatRateLimitOrder,
} from 'components/swapv2/LimitOrder/helpers'
import { LimitOrder, LimitOrderStatus } from 'components/swapv2/LimitOrder/type'

export default function SummaryNotify({
  type,
  message,
  orders = [],
}: {
  type?: LimitOrderStatus
  message?: string
  orders?: LimitOrder[]
}) {
  const isMultiOrder = orders.length > 1
  const order = orders[0]
  const {
    makingAmount,
    makerAssetSymbol,
    takingAmount,
    takerAssetSymbol,
    filledTakingAmount,
    makerAssetDecimals,
    takerAssetDecimals,
  } = order || ({} as LimitOrder)
  const rate = order ? formatRateLimitOrder(order, false) : ''
  const filledPercent = order ? calcPercentFilledOrder(filledTakingAmount, takingAmount, takerAssetDecimals) : 0
  const mainMsg = order ? (
    <Trans>
      <span className="font-medium">
        {formatAmountOrder(makingAmount, makerAssetDecimals)} {makerAssetSymbol}
      </span>{' '}
      and receive{' '}
      <span className="font-medium">
        {formatAmountOrder(takingAmount, takerAssetDecimals)} {takerAssetSymbol}
      </span>{' '}
      <span className="text-subText">
        at {takerAssetSymbol} price of {rate} {makerAssetSymbol}
      </span>
    </Trans>
  ) : null

  let msg: ReactNode
  const listOrderName = (
    <ul className="m-0 pb-0 pl-[15px] pr-0 pt-[5px]">
      {orders.map(order => (
        <li key={order.id}>
          {formatAmountOrder(order.makingAmount, order.makerAssetDecimals)} {order.makerAssetSymbol} <Trans>to</Trans>{' '}
          {formatAmountOrder(order.takingAmount, order.takerAssetDecimals)} {order.takerAssetSymbol}
        </li>
      ))}
    </ul>
  )

  const filledComponent =
    filledPercent && parseFloat(filledPercent) !== 0 ? (
      <>
        <br />
        <Trans>Your order was {filledPercent}% filled</Trans>
      </>
    ) : null

  switch (type) {
    case LimitOrderStatus.CANCELLED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below have successfully cancelled:
            <br />
            {listOrderName}
          </Trans>
        )
      else
        msg = (
          <Trans>
            You have successfully cancelled an order to pay {mainMsg}
            {filledComponent}
          </Trans>
        )
      break
    case LimitOrderStatus.CANCELLED_FAILED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below cancel failed:
            <br />
            {listOrderName}
          </Trans>
        )
      else msg = <Trans>Cancel order to pay {mainMsg} failed</Trans>
      break
    case LimitOrderStatus.FILLED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below was successfully filled:
            <br />
            {listOrderName}
          </Trans>
        )
      else msg = <Trans>Your order to pay {mainMsg} was successfully filled</Trans>
      break
    case LimitOrderStatus.PARTIALLY_FILLED:
      msg = (
        <Trans>
          Your order to pay {mainMsg} is {filledPercent}% filled
        </Trans>
      )
      break
    case LimitOrderStatus.EXPIRED:
      if (isMultiOrder)
        msg = (
          <Trans>
            Your orders below has expired:
            <br />
            {listOrderName}
          </Trans>
        )
      else
        msg = (
          <Trans>
            Your order to pay {mainMsg} has expired
            {filledComponent}
          </Trans>
        )
      break
  }

  return <p className="m-0 leading-[18px] text-text">{message || msg}</p>
}

export const SummaryNotifyOrderPlaced = ({
  currencyIn,
  currencyOut,
  inputAmount,
  outputAmount,
}: {
  currencyIn: Currency
  currencyOut: Currency
  inputAmount: string
  outputAmount: string
}) => {
  return (
    <p className="m-0 leading-[18px] text-text">
      <Trans>
        You have successfully placed an order to pay{' '}
        <span className="font-medium">
          {formatAmountOrder(inputAmount)} {currencyIn.symbol}
        </span>{' '}
        and receive{' '}
        <span className="font-medium">
          {formatAmountOrder(outputAmount)} {currencyOut.symbol}{' '}
        </span>
        <span className="text-subText">
          at {currencyIn.symbol} price of {calcRate(inputAmount, outputAmount, currencyOut.decimals)}{' '}
          {currencyOut.symbol}.
        </span>
      </Trans>
    </p>
  )
}
