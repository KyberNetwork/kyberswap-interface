import { t } from '@lingui/macro'
import { Fragment, useMemo } from 'react'
import { formatUnits } from 'viem'

import Logo from 'components/Logo'
import { useCrossChainSwap } from 'components/SwapForm/CrossChain/hooks/useCrossChainSwap'
import {
  ArrowHead,
  EmptyRoute,
  HopCard,
  HopList,
  PairRow,
  PairTokenSlot,
  PoolLabel,
  PoolList,
  RouteArrow,
  RouteConnector,
  RouteDot,
  RouteList,
  RouteRow,
  TokenLink,
} from 'components/TradeRouting/styled'
import { NETWORKS_INFO } from 'constants/networks'
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

const StepCard = ({ step }: { step: RouteStep }) => {
  const provider = registry.getAdapter(step.provider)
  const logo = step.logo || provider?.getIcon()
  const token = step.tokenOut
  const network = token && NETWORKS_INFO[token.chainId as keyof typeof NETWORKS_INFO]
  const amount = token && step.amountOut ? formatUnits(BigInt(step.amountOut), token.decimals) : undefined
  return (
    <HopCard className="w-max min-w-[220px] basis-auto">
      <div className="flex items-center gap-1.5 whitespace-nowrap text-xs text-subText">
        <span className="font-medium">{stepLabel(step.type)}</span>
        {token && (
          <>
            <span>→</span>
            <span className="relative shrink-0">
              <Logo
                srcs={[token.logoURI || token.icon || '', network ? getTokenLogoURL(token.address, token.chainId) : '']}
                width={16}
                height={16}
                className="rounded-full"
                alt={token.symbol}
              />
              {network && (
                <img
                  src={network.icon}
                  alt={network.name}
                  className="absolute -bottom-1 -right-1 size-2 rounded-full"
                />
              )}
            </span>
            <span>
              {amount ? `${formatDisplayNumber(amount, { significantDigits: 6 })} ` : ''}
              {token.symbol}
            </span>
          </>
        )}
      </div>
      <PoolList>
        <PoolLabel>
          {logo && <img src={logo} className="img--sm" alt="" />}
          {provider?.getName() || step.provider}
        </PoolLabel>
      </PoolList>
    </HopCard>
  )
}

/** Displays the selected quote using single-chain routing primitives.
 * Provider payload interpretation belongs to getCrossChainRouteSteps; this view must not invent intermediate legs or amounts. */
const CrossChainTradeRoute = ({ defaultCollapsed }: { defaultCollapsed: boolean }) => {
  const { currencyIn, currencyOut, fromChainId, toChainId, selectedQuote, loading } = useCrossChainSwap()
  const steps = useMemo(() => (selectedQuote ? getCrossChainRouteSteps(selectedQuote) : []), [selectedQuote])
  const quote = selectedQuote?.quote
  const amountIn = quote
    ? formatUnits(BigInt(quote.quoteParams.amount), quote.quoteParams.fromToken.decimals)
    : undefined
  const tokens = [
    { currency: currencyIn, chain: fromChainId, amount: amountIn },
    { currency: currencyOut, chain: toChainId, amount: quote?.formattedOutputAmount },
  ]
  const tokenLabel = (index: number) => {
    const { currency, chain, amount } = tokens[index]
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

  return (
    <TradeRoutePanel
      defaultCollapsed={defaultCollapsed}
      heading={
        <div className="flex flex-wrap items-center gap-2 text-base font-medium text-subText max-sm:text-sm">
          <span className="text-lg font-medium text-blue max-sm:hidden">Route:</span>
          {tokenLabel(0)}
          <span>→</span>
          {tokenLabel(1)}
        </div>
      }
    >
      {loading && !selectedQuote ? (
        <TradeRouteSkeleton crossChain />
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="w-max min-w-full">
            <PairRow className="min-w-[420px] gap-6">
              <PairTokenSlot>
                <TokenLink as="div">{tokenLabel(0)}</TokenLink>
              </PairTokenSlot>
              <PairTokenSlot>
                <TokenLink as="div" reverse>
                  {tokenLabel(1)}
                </TokenLink>
              </PairTokenSlot>
            </PairRow>
            {!selectedQuote ? (
              <EmptyRoute />
            ) : (
              <RouteList>
                <RouteDot />
                <RouteDot out />
                <RouteRow className="gap-6 py-2.5 pl-6">
                  <RouteConnector />
                  <HopList className="relative flex-1 justify-evenly gap-3">
                    {steps.map((step, index) => (
                      <Fragment key={`${step.type}-${step.provider}-${index}`}>
                        {index > 0 && (
                          <RouteArrow>
                            <ArrowHead />
                          </RouteArrow>
                        )}
                        <StepCard step={step} />
                      </Fragment>
                    ))}
                  </HopList>
                  <RouteArrow>
                    <ArrowHead />
                  </RouteArrow>
                </RouteRow>
              </RouteList>
            )}
          </div>
        </div>
      )}
    </TradeRoutePanel>
  )
}

export default CrossChainTradeRoute
