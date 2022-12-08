import { Trans, t } from '@lingui/macro'
import { ReactNode } from 'react'
import { Text } from 'rebass'

import useTheme from 'hooks/useTheme'

import { calcPercentFilledOrder, formatAmountOrder, formatRateOrder } from '../helpers'
import { LimitOrder, LimitOrderStatus } from '../type'

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
  const { makingAmount, makerAssetSymbol, takingAmount, takerAssetSymbol, filledTakingAmount } =
    order || ({} as LimitOrder)
  const theme = useTheme()
  const rate = order ? formatRateOrder(order, false) : ''
  const filledPercent = order ? calcPercentFilledOrder(filledTakingAmount, takingAmount) : 0
  const mainMsg = order ? (
    <>
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(makingAmount)} {makerAssetSymbol}
      </Text>{' '}
      and receive{' '}
      <Text as="span" fontWeight={500}>
        {formatAmountOrder(takingAmount)} {takerAssetSymbol}
      </Text>{' '}
      <Text as="span" color={theme.subText}>
        when 1 {takerAssetSymbol} is equal to {rate} {makerAssetSymbol}
      </Text>
    </>
  ) : null

  let msg: ReactNode
  const listOrderName = (
    <ul
      style={{
        padding: '5px 0px 0px 15px',
        margin: '0',
      }}
    >
      {orders.map(order => (
        <li key={order.id}>
          {t`${formatAmountOrder(order.makingAmount)} ${order.makerAssetSymbol} to ${formatAmountOrder(
            order.takingAmount,
          )} ${order.takerAssetSymbol}`}
        </li>
      ))}
    </ul>
  )
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
            {filledPercent ? (
              <>
                <br />
                Your order was {filledPercent}% filled
              </>
            ) : null}
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
            {filledPercent ? (
              <>
                <br />
                Your order was {filledPercent}% filled
              </>
            ) : null}
          </Trans>
        )
      break
  }

  return (
    <Text color={theme.text} lineHeight="18px">
      {message || msg}
    </Text>
  )
}
