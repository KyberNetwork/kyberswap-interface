import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { CrossChainSwapFactory, registry } from 'services/crossChain/factory'
import type { Quote } from 'services/crossChain/registry'
import { normalizeAdapterName } from 'services/crossChain/utils'
import { formatUnits } from 'viem'

import UnknownToken from 'assets/svg/kyber/unknown-token.svg'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import { TokenLogoWithChain } from 'components/TokenLogo/TokenLogoWithChain'
import RouteGraphView, { EmptyRouteGraph } from 'components/TradeRouting/RouteGraphView'
import TradeRoutePanel, { TradeRouteSkeleton } from 'components/TradeRouting/TradeRoutePanel'
import { type RouteStep, getCrossChainRouteSteps } from 'components/TradeRouting/getCrossChainRouteSteps'
import { buildSequentialRouteGraph } from 'components/TradeRouting/routeGraph'
import { PairRow, PairTokenSlot, RouteContent, TokenLink } from 'components/TradeRouting/styled'
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
      const provider =
        registry.getAdapter(step.provider) ||
        CrossChainSwapFactory.getKyberCrossBridgeSources().find(
          source => normalizeAdapterName(source.getName()) === normalizeAdapterName(step.provider),
        )
      const id = `${index}:${step.type}:${step.provider}`

      return {
        id,
        label: stepLabel(step.type),
        groups: [
          {
            id,
            pools: [
              {
                id: step.provider,
                name: provider?.getName() || step.provider,
                logo: step.logo || provider?.getIcon?.(),
              },
            ],
          },
        ],
      }
    }),
  )

const RouteTokenLabel = ({ currency, chain, amount }: { currency?: Currency; chain?: Chain; amount?: string }) => {
  if (!currency || !chain) return <img src={UnknownToken} className="size-[18px]" alt="" />

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
          {!selectedQuote ? <EmptyRouteGraph message={t`No route found`} /> : <RouteGraphView graph={graph} />}
        </RouteContent>
      )}
    </TradeRoutePanel>
  )
}

export default CrossChainTradeRoute
