import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'
import { useGetStopMarketActiveMakingAmountQuery } from 'services/stopMarket'

import { useHoneypotWarning } from 'components/HoneypotWarning'
import { getOrderListPath } from 'components/LimitOrder/hooks/useOrderListNavigation'
import { LimitOrderStatus, OrderKind } from 'components/LimitOrder/types'
import { hasReservedBalanceShortfall, parseRawAmount } from 'components/StopMarket/utils'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { getSwapReviewData } from 'components/SwapForm/SwapModal/reviewData'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { isSupportStopMarket } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { usePairCategory } from 'state/swap/hooks'
import { useTokenBalance } from 'state/wallet/hooks'

export const useSwapReviewData = (buildResult: BuildRouteResult | undefined) => {
  const form = useSwapFormContext()
  const { routeSummary } = form
  const category = usePairCategory()
  const currencyIn = routeSummary?.parsedAmountIn.currency
  const currencyOut = routeSummary?.parsedAmountOut.currency
  const { chainId, account } = useActiveWeb3React()
  const { honeypot } = useHoneypotWarning({
    chainId,
    tokenAddress: currencyIn?.wrapped.address,
    tokenSymbol: currencyIn?.symbol,
  })

  const { data: loActiveMakingAmount } = useGetTotalActiveMakingAmountQuery(
    {
      chainId,
      makerAsset: currencyIn?.wrapped.address,
      takerAsset: currencyOut?.wrapped.address,
      account,
    },
    { skip: !currencyIn || !currencyOut || !account || currencyIn.isNative },
  )
  // Open stop market orders sell from the same balance; a native sell is out of their reach, like the limit one.
  const { data: stopActiveMakingAmount } = useGetStopMarketActiveMakingAmountQuery(
    { chainId, userWallet: account || '', tokenIn: currencyIn?.wrapped.address ?? '' },
    { skip: !currencyIn || !account || currencyIn.isNative || !isSupportStopMarket(chainId) },
  )
  const limitReservedAmount = parseRawAmount(loActiveMakingAmount)
  const stopReservedAmount = parseRawAmount(stopActiveMakingAmount)

  const balance = useTokenBalance(currencyIn?.wrapped)

  const remainAmount = BigInt(balance?.quotient.toString() || 0) - BigInt(buildResult?.data?.amountIn || 0)

  const showReservedOrderNotice =
    !currencyIn?.isNative && hasReservedBalanceShortfall(remainAmount, limitReservedAmount + stopReservedAmount)
  const limitOrdersPath = getOrderListPath({
    kind: OrderKind.LIMIT,
    chainId,
    status: LimitOrderStatus.ACTIVE,
    currencyIn,
    currencyOut,
    search: `${currencyIn?.wrapped.symbol}/${currencyOut?.wrapped.symbol}`,
  })
  const stopMarketsPath = getOrderListPath({
    kind: OrderKind.STOP,
    chainId,
    currencyIn,
    currencyOut,
    search: currencyIn?.wrapped.symbol ?? '',
  })

  return {
    ...getSwapReviewData({ ...form, buildResult, category }),
    honeypot,
    showReservedOrderWarning: showReservedOrderNotice,
    reservedOrderLink: limitReservedAmount > 0n ? limitOrdersPath : undefined,
    reservedStopMarketLink: stopReservedAmount > 0n ? stopMarketsPath : undefined,
  }
}

export type SwapReviewData = ReturnType<typeof useSwapReviewData>
