import type { Currency } from '@kyberswap/ks-sdk-core'
import { useCallback } from 'react'

import TokenPriceChart from 'components/TokenPriceChart'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import SingleChainTradeRoute from 'pages/Swap/components/SingleChainTradeRoute'
import { Field } from 'state/swap/actions'
import { useShowPricingChart, useShowTradeRoutes } from 'state/user/hooks'
import type { DetailedRouteSummary } from 'types/route'
import { useTradeComposition } from 'utils/aggregationRouting'
import { getTokenAddress } from 'utils/tokenInfo'

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  routeSummary: DetailedRouteSummary | undefined
  loading: boolean
}

export const SingleChainRightPanel = ({ currencyIn, currencyOut, routeSummary, loading }: Props) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = currencyIn?.chainId ?? walletChainId
  const networkInfo = NETWORKS_INFO[chainId]
  const isSameChain = !currencyIn || !currencyOut || currencyIn.chainId === currencyOut.chainId
  const isShowPricingChart = useShowPricingChart()
  const isShowTradeRoutes = useShowTradeRoutes()
  const { trackingHandler } = useTracking({
    [Field.INPUT]: currencyIn,
    [Field.OUTPUT]: currencyOut,
  })

  const tradeRouteComposition = useTradeComposition({
    chainId,
    inputAmount: routeSummary?.parsedAmountIn,
    swaps: routeSummary?.route,
  })

  const handleViewRoute = useCallback(() => {
    trackingHandler(TRACKING_EVENT_TYPE.SWAP_ROUTE_VIEWED, {
      from_token: currencyIn?.symbol,
      from_token_address: currencyIn ? getTokenAddress(currencyIn) : undefined,
      to_token: currencyOut?.symbol,
      to_token_address: currencyOut ? getTokenAddress(currencyOut) : undefined,
      amount_in: routeSummary?.parsedAmountIn?.toSignificant(6),
      amount_in_usd: routeSummary?.amountInUsd ? Number(routeSummary.amountInUsd) : undefined,
      amount_out: routeSummary?.parsedAmountOut?.toSignificant(6),
      amount_out_usd: routeSummary?.amountOutUsd ? Number(routeSummary.amountOutUsd) : undefined,
      trade_route_dexes: [...new Set(routeSummary?.route?.flat().map(swap => swap.exchange) || [])],
      trade_route_steps: routeSummary?.route?.length,
      route_split: (routeSummary?.route?.length || 0) > 1,
      is_smart_settlement: Boolean(routeSummary?.isSmartSettlement),
      chain: networkInfo.name,
    })
  }, [currencyIn, currencyOut, networkInfo.name, routeSummary, trackingHandler])

  return (
    <>
      {isSameChain && isShowPricingChart && <TokenPriceChart tokens={[currencyIn, currencyOut]} />}
      {isSameChain && isShowTradeRoutes && (
        <SingleChainTradeRoute
          tradeComposition={tradeRouteComposition}
          loading={loading}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          inputAmount={routeSummary?.parsedAmountIn}
          outputAmount={routeSummary?.parsedAmountOut}
          isSmartSettlement={routeSummary?.isSmartSettlement}
          onExpand={handleViewRoute}
        />
      )}
    </>
  )
}
