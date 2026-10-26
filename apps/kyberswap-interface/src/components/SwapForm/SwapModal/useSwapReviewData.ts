import { useParams } from 'react-router-dom'
import { useGetTotalActiveMakingAmountQuery } from 'services/limitOrder'

import { useHoneypotWarning } from 'components/HoneypotWarning'
import { LimitOrderStatus, LimitOrderTab } from 'components/LimitOrder/types'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { getSwapReviewData } from 'components/SwapForm/SwapModal/reviewData'
import { BuildRouteResult } from 'components/SwapForm/hooks/useBuildRoute'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { usePairCategory } from 'state/swap/hooks'
import { useTokenBalance } from 'state/wallet/hooks'

export const useSwapReviewData = (buildResult: BuildRouteResult | undefined) => {
  const form = useSwapFormContext()
  const { routeSummary } = form
  const category = usePairCategory()
  const currencyIn = routeSummary?.parsedAmountIn.currency
  const currencyOut = routeSummary?.parsedAmountOut.currency
  const { currency: currencyParam } = useParams()
  const { chainId, account, networkInfo } = useActiveWeb3React()
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
  const activeMakingAmount = BigInt(loActiveMakingAmount || 0)

  const balance = useTokenBalance(currencyIn?.wrapped)

  const remainAmount = BigInt(balance?.quotient.toString() || 0) - BigInt(buildResult?.data?.amountIn || 0)

  const showLOWwarning = currencyIn?.isNative ? false : !!loActiveMakingAmount && remainAmount < activeMakingAmount
  const limitOrderSearch = new URLSearchParams({
    tab: LimitOrderTab.MY_ORDER,
    orderTab: LimitOrderStatus.ACTIVE,
    search: `${currencyIn?.wrapped.symbol}/${currencyOut?.wrapped.symbol}`,
  })

  return {
    ...getSwapReviewData({ ...form, buildResult, category }),
    honeypot,
    showReservedOrderWarning: showLOWwarning,
    reservedOrderLink: `${APP_PATHS.LIMIT}/${networkInfo.route}/${currencyParam}?${limitOrderSearch}`,
  }
}

export type SwapReviewData = ReturnType<typeof useSwapReviewData>
