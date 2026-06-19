import { Currency } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { useCreateOrderMutation } from 'services/limitOrder'

import { NotificationType } from 'components/Announcement/type'
import { useSignOrder } from 'components/LimitOrder/CreateOrder/hooks/useSignOrder'
import { SummaryNotifyOrderPlaced } from 'components/LimitOrder/MyOrders/SummaryNotify'
import { calcUsdPrices, getPayloadCreateOrder, removeTrailingZero } from 'components/LimitOrder/helpers'
import { CreateOrderParams, LimitOrderCreateContext } from 'components/LimitOrder/types'
import { getTipLinkAttribution } from 'components/TipLinkGeneratorModal/shared'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { useNotify } from 'state/application/hooks'
import { getCookieValue } from 'utils'

const getTokenAddress = (currency: Currency | undefined) => (currency?.isNative ? 'NATIVE' : currency?.wrapped?.address)

type UseCreateLimitOrderArgs = {
  order: LimitOrderCreateContext
  searchParams: URLSearchParams
  estimateUSD: ReturnType<typeof calcUsdPrices>
  onError?: (error: unknown) => void
  onSuccess?: () => void
}

export const useCreateLimitOrder = ({
  order,
  searchParams,
  estimateUSD,
  onError,
  onSuccess,
}: UseCreateLimitOrderArgs) => {
  const {
    currencyIn,
    currencyOut,
    chainId,
    networkName,
    inputAmount,
    outputAmount,
    displayRate,
    expiredAt,
    displayTime,
    tradeInfo,
    deltaRate,
  } = order
  const { account } = useActiveWeb3React()
  const { trackingHandler } = useTracking()
  const notify = useNotify()
  const signOrder = useSignOrder()

  const [submitOrder] = useCreateOrderMutation()

  const trackPlaceOrder = (type: TRACKING_EVENT_TYPE, data = {}) => {
    trackingHandler(type, {
      from_token: currencyIn?.symbol,
      to_token: currencyOut?.symbol,
      from_network: networkName,
      trade_qty: inputAmount,
      ...data,
    })
  }

  const submitCreateOrder = async (params: CreateOrderParams) => {
    try {
      const { currencyIn, currencyOut, account, inputAmount, outputAmount, expiredAt } = params
      if (!currencyIn || !currencyOut || !account || !inputAmount || !outputAmount || !expiredAt) {
        throw new Error('wrong input')
      }

      const refCode = getCookieValue('refCode')
      const clientId = searchParams.get('clientId')

      const { signature, salt } = await signOrder({ ...params, referral: refCode })
      const payload = getPayloadCreateOrder(params)
      const response = await submitOrder({
        ...payload,
        salt: salt || '',
        signature,
        referral: refCode,
        clientId,
      }).unwrap()

      notify(
        {
          type: NotificationType.SUCCESS,
          title: t`Order Placed`,
          summary: <SummaryNotifyOrderPlaced {...{ currencyIn, currencyOut, inputAmount, outputAmount }} />,
        },
        10000,
      )
      onSuccess?.()
      return response?.id
    } catch (error) {
      onError?.(error)
      return
    }
  }

  const submitCreateOrderWithTracking = async () => {
    trackPlaceOrder(TRACKING_EVENT_TYPE.LO_CLICK_PLACE_ORDER)
    const order_id = await submitCreateOrder({
      currencyIn,
      currencyOut,
      chainId,
      account,
      inputAmount,
      outputAmount,
      expiredAt,
    })
    if (!order_id) return

    trackPlaceOrder(TRACKING_EVENT_TYPE.LO_PLACE_ORDER_SUCCESS, { order_id })
    trackingHandler(TRACKING_EVENT_TYPE.LO_ORDER_PLACED, {
      side: 'sell',
      from_token: currencyIn?.symbol,
      from_token_address: getTokenAddress(currencyIn),
      to_token: currencyOut?.symbol,
      to_token_address: getTokenAddress(currencyOut),
      pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
      limit_price: displayRate,
      market_price: tradeInfo ? removeTrailingZero(tradeInfo.marketRate.toFixed(16)) : undefined,
      price_difference_pct: deltaRate.rawPercent ? Number(deltaRate.rawPercent) : undefined,
      amount_in: inputAmount,
      amount_in_usd: estimateUSD.rawInput || undefined,
      amount_out_estimated: outputAmount,
      expiry: displayTime,
      chain: networkName,
      order_id,
      volume: estimateUSD.rawInput || undefined,
    })

    const tipLink = getTipLinkAttribution(searchParams)
    if (tipLink) {
      trackingHandler(TRACKING_EVENT_TYPE.TIP_LINK_TRADE, {
        trade_type: 'limit_order',
        trade_status: 'placed',
        tip_charged: false,
        ...tipLink,
        input_token: currencyIn?.symbol,
        output_token: currencyOut?.symbol,
        input_token_address: getTokenAddress(currencyIn),
        output_token_address: getTokenAddress(currencyOut),
        pair: currencyIn && currencyOut ? `${currencyIn.symbol}/${currencyOut.symbol}` : undefined,
        chain: networkName,
        chain_id: chainId,
        volume: estimateUSD.rawInput || undefined,
        order_id,
      })
    }
    return order_id
  }

  return { submitCreateOrderWithTracking }
}
