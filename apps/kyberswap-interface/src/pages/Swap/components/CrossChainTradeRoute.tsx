import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { formatUnits } from 'viem'

import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import RouteGraphView from 'components/TradeRouting/RouteGraphView'
import { buildSequentialRouteGraph } from 'components/TradeRouting/routeGraph'
import { EmptyRoute, PairRow, PairTokenSlot, RouteContent, TokenLink } from 'components/TradeRouting/styled'
import TradeRoutePanel, { TradeRouteSkeleton } from 'pages/Swap/components/TradeRoutePanel'
import { TokenLogoWithChain } from 'pages/Swap/crossChain/components/TokenLogoWithChain'
import { registry } from 'pages/Swap/crossChain/factory'
import type { Quote } from 'pages/Swap/crossChain/registry'
import { type RouteStep, getCrossChainRouteSteps } from 'pages/Swap/utils/getCrossChainRouteSteps'
import { type Chain, type Currency } from 'types/crossChain'
import { formatDisplayNumber } from 'utils/numbers'

const stepLabel = (type: RouteStep['type']) => {
  switch (type) {
    case 'swap':
      return t`Swap`
    case 'bridge':
      return t`Bridge`
    default:
      return t`Route`
  }
}

const buildCrossChainGraph = (steps: RouteStep[]) =>
  buildSequentialRouteGraph(
    steps.map((step, index) => {
      const provider = registry.getAdapter(step.provider)
      const id = `${index}:${step.type}:${step.provider}`

      return {
        id,
        label: stepLabel(step.type),
        groups: [
          {
            id,
            pools: [
              { id: step.provider, name: provider?.getName() || step.provider, logo: step.logo || provider?.getIcon() },
            ],
          },
        ],
      }
    }),
  )

const RouteTokenLabel = ({ currency, chain, amount }: { currency?: Currency; chain?: Chain; amount?: string }) => {
  if (!currency || !chain) return null

  return (
    <span className="inline-flex items-center gap-1.5">
      <TokenLogoWithChain currency={currency} chainId={chain} size={18} />
      <span>
        {amount ? `${formatDisplayNumber(amount, { significantDigits: 8 })} ` : ''}
        {currency.symbol}
      </span>
    </span>
  )
}

/** Displays the selected provider, with route-plan steps for KyberCross. */
const CrossChainTradeRoute = ({ defaultCollapsed }: { defaultCollapsed?: boolean }) => (
  <CrossChainTradeRouteView {...useCrossChainSwap()} defaultCollapsed={defaultCollapsed} />
)

type Props = {
  currencyIn?: Currency
  currencyOut?: Currency
  fromChainId: Chain
  toChainId?: Chain
  selectedQuote: Quote | null
  loading: boolean
  defaultCollapsed?: boolean
}

export const CrossChainTradeRouteView = ({
  currencyIn,
  currencyOut,
  fromChainId,
  toChainId,
  selectedQuote,
  loading,
  defaultCollapsed,
}: Props) => {
  const steps = useMemo(() => (selectedQuote ? getCrossChainRouteSteps(selectedQuote) : []), [selectedQuote])
  const graph = useMemo(() => buildCrossChainGraph(steps), [steps])
  const quote = selectedQuote?.quote
  const amountIn = quote
    ? formatUnits(BigInt(quote.quoteParams.amount), quote.quoteParams.fromToken.decimals)
    : undefined

  return (
    <TradeRoutePanel
      defaultCollapsed={defaultCollapsed}
      heading={
        <div className="flex flex-wrap items-center gap-2 text-base font-medium text-subText max-sm:text-sm">
          <span className="text-lg font-medium text-blue max-sm:hidden">Route:</span>
          <RouteTokenLabel currency={currencyIn} chain={fromChainId} amount={amountIn} />
          <span>→</span>
          <RouteTokenLabel currency={currencyOut} chain={toChainId} amount={quote?.formattedOutputAmount} />
        </div>
      }
    >
      {loading && !selectedQuote ? (
        <TradeRouteSkeleton poolLines={1} />
      ) : (
        <RouteContent>
          <PairRow className="gap-6">
            <PairTokenSlot>
              <TokenLink as="div">
                <RouteTokenLabel currency={currencyIn} chain={fromChainId} amount={amountIn} />
              </TokenLink>
            </PairTokenSlot>
            <PairTokenSlot>
              <TokenLink as="div" reverse>
                <RouteTokenLabel currency={currencyOut} chain={toChainId} amount={quote?.formattedOutputAmount} />
              </TokenLink>
            </PairTokenSlot>
          </PairRow>
          {!selectedQuote ? <EmptyRoute /> : <RouteGraphView graph={graph} />}
        </RouteContent>
      )}
    </TradeRoutePanel>
  )
}

export default CrossChainTradeRoute
