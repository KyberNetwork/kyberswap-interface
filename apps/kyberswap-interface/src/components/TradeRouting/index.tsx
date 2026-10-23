import { ChainId, Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { memo, useMemo } from 'react'

import CurrencyLogo from 'components/CurrencyLogo'
import RouteGraphView from 'components/TradeRouting/RouteGraphView'
import { buildV2RouteGraph, buildV3RouteGraph } from 'components/TradeRouting/routeGraph'
import { EmptyRoute, PairRow, PairTokenSlot, RouteContent, TokenLink } from 'components/TradeRouting/styled'
import { useActiveWeb3React } from 'hooks'
import { useAllDexes } from 'state/customizeDexes/hooks'
import { SwapRouteV2, SwapRouteV3 } from 'utils/aggregationRouting'
import { hasNativeErc20Interface } from 'utils/nativeErc20'

const PairToken = ({
  currency,
  amount,
  reverse,
}: {
  currency: Currency | undefined
  amount: CurrencyAmount<Currency> | undefined
  reverse?: boolean
}) =>
  currency ? (
    <TokenLink as="div" reverse={reverse} className="border-none">
      <CurrencyLogo currency={currency} size="20px" />
      <span>{`${amount ? amount.toSignificant(8) : ''} ${currency.symbol}`}</span>
    </TokenLink>
  ) : null

type RoutingProps = {
  maxHeight?: string

  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  customChainId?: ChainId
}

const Routing = ({
  customChainId,
  tradeComposition,
  maxHeight,
  inputAmount,
  outputAmount,
  currencyIn,
  currencyOut,
}: RoutingProps) => {
  const { chainId: walletChainId } = useActiveWeb3React()
  const chainId = customChainId ?? currencyIn?.chainId ?? currencyOut?.chainId ?? walletChainId
  const allDexes = useAllDexes(chainId)

  const wrappedNative = hasNativeErc20Interface(chainId) ? undefined : WETH[chainId]
  const isWrap = Boolean(currencyIn?.isNative && currencyOut && wrappedNative?.equals(currencyOut))
  const isUnwrap = Boolean(currencyOut?.isNative && currencyIn && wrappedNative?.equals(currencyIn))

  const availableRoute = chainId && tradeComposition && tradeComposition.length > 0

  const graph = useMemo(() => {
    if (!tradeComposition?.length) return null

    if (tradeComposition.every((route): route is SwapRouteV3 => 'pool' in route)) {
      return inputAmount && outputAmount
        ? buildV3RouteGraph(tradeComposition, inputAmount.currency.wrapped, allDexes)
        : null
    }

    return buildV2RouteGraph(tradeComposition as SwapRouteV2[], chainId, allDexes)
  }, [tradeComposition, inputAmount, outputAmount, chainId, allDexes])

  return (
    <div className="ks-scrollbar min-h-0 overflow-y-auto overflow-x-hidden" style={{ maxHeight: maxHeight || '100%' }}>
      <RouteContent>
        <PairRow>
          <PairTokenSlot>
            <PairToken currency={currencyIn} amount={inputAmount} />
          </PairTokenSlot>
          <PairTokenSlot>
            <PairToken currency={currencyOut} amount={outputAmount} reverse />
          </PairTokenSlot>
        </PairRow>

        {!availableRoute ? (
          <EmptyRoute message={isWrap ? t`Wrapping` : isUnwrap ? t`Unwrapping` : undefined} />
        ) : graph ? (
          <RouteGraphView graph={graph} />
        ) : null}
      </RouteContent>
    </div>
  )
}

export default memo(Routing)
