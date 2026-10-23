import { t } from '@lingui/macro'
import { useMemo } from 'react'
import { formatUnits } from 'viem'

import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import RouteGraphView from 'components/TradeRouting/RouteGraphView'
import { buildSequentialRouteGraph } from 'components/TradeRouting/routeGraph'
import { EmptyRoute, PairRow, PairTokenSlot, RouteContent, TokenLink } from 'components/TradeRouting/styled'
import { NETWORKS_INFO } from 'constants/networks'
import { type Chain, type Currency } from 'pages/CrossChainSwap/adapters'
import { TokenLogoWithChain } from 'pages/CrossChainSwap/components/TokenLogoWithChain'
import { registry } from 'pages/CrossChainSwap/factory'
import TradeRoutePanel, { TradeRouteSkeleton } from 'pages/Swap/components/TradeRoutePanel'
import { type RouteStep, getCrossChainRouteSteps } from 'pages/Swap/utils/getCrossChainRouteSteps'
import { formatDisplayNumber } from 'utils/numbers'
import { getTokenLogoURL } from 'utils/tokenLogo'

const stepLabel = (type: RouteStep['type']) => {
  switch (type) {
    case 'swap':
      return t`Swap`
    case 'bridge':
      return t`Bridge`
    case 'wrap':
      return t`Wrap`
    case 'unwrap':
      return t`Unwrap`
    default:
      return t`Route`
  }
}

const buildCrossChainGraph = (steps: RouteStep[]) =>
  buildSequentialRouteGraph(
    steps.map((step, index) => {
      const provider = registry.getAdapter(step.provider)
      const token = step.tokenOut
      const network = token && NETWORKS_INFO[token.chainId as keyof typeof NETWORKS_INFO]
      const amount = token && step.amountOut ? formatUnits(BigInt(step.amountOut), token.decimals) : undefined
      const id = `${index}:${step.type}:${step.provider}:${token?.chainId ?? ''}:${token?.address ?? ''}`

      return {
        id,
        label: token
          ? `${stepLabel(step.type)} → ${amount ? `${formatDisplayNumber(amount, { significantDigits: 6 })} ` : ''}${
              token.symbol
            }`
          : stepLabel(step.type),
        logoSources: token
          ? [token.logoURI || token.icon || '', network ? getTokenLogoURL(token.address, token.chainId) : '']
          : undefined,
        chainBadge: network ? { src: network.icon, name: network.name } : undefined,
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

/** Displays the selected quote using single-chain routing primitives.
 * Provider payload interpretation belongs to getCrossChainRouteSteps; this view must not invent intermediate legs or amounts. */
const CrossChainTradeRoute = () => {
  const { currencyIn, currencyOut, fromChainId, toChainId, selectedQuote, loading } = useCrossChainSwap()
  const steps = useMemo(() => (selectedQuote ? getCrossChainRouteSteps(selectedQuote) : []), [selectedQuote])
  const graph = useMemo(() => buildCrossChainGraph(steps), [steps])
  const quote = selectedQuote?.quote
  const amountIn = quote
    ? formatUnits(BigInt(quote.quoteParams.amount), quote.quoteParams.fromToken.decimals)
    : undefined

  return (
    <TradeRoutePanel
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
