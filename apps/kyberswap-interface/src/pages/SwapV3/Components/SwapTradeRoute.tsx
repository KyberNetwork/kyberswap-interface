import { type Currency, type CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Info } from 'react-feather'

import { ReactComponent as RoutingIcon } from 'assets/svg/routing-icon.svg'
import CurrencyLogo from 'components/CurrencyLogo'
import { ShieldChecked } from 'components/Icons'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { ClickTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { type SwapRouteV2, type SwapRouteV3 } from 'utils/aggregationRouting'
import { cn } from 'utils/cn'

const TradeRouting = lazy(() => import('components/TradeRouting'))

const TradeRouteSkeleton = () => {
  const theme = useTheme()
  return (
    <Stack gap={40} py={12}>
      <HStack align="center" justify="space-between" gap={16}>
        <Skeleton height={24} variant="darkSubtle" width={108} />
        <Skeleton height={24} variant="darkSubtle" width={108} />
      </HStack>

      <HStack justify="space-evenly" gap={12}>
        {[0, 1].map(index => (
          <Stack key={index} gap={12} width={180} p={12} border={`1px solid ${theme.darkBorder}`} borderRadius={12}>
            <Skeleton height={20} variant="darkSubtle" width={96} />
            <Skeleton height={28} variant="darkSubtle" width="100%" />
          </Stack>
        ))}
      </HStack>
    </Stack>
  )
}

type SwapTradeRouteProps = {
  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultCollapsed?: boolean
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  isSmartSettlementActive?: boolean
  scrollOnExpand?: boolean
}

const SwapTradeRoute = ({
  tradeComposition,
  currencyIn,
  currencyOut,
  defaultCollapsed = false,
  inputAmount,
  outputAmount,
  isSmartSettlementActive = false,
  scrollOnExpand = true,
}: SwapTradeRouteProps) => {
  const panelRef = useRef<HTMLDivElement>(null)

  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)

  useEffect(() => {
    setIsExpanded(!defaultCollapsed)
  }, [defaultCollapsed])

  const titleData = useMemo(
    () => ({
      amountIn: inputAmount?.toSignificant(8),
      amountOut: outputAmount?.toSignificant(8),
      inputSymbol: currencyIn?.symbol,
      outputSymbol: currencyOut?.symbol,
    }),
    [currencyIn?.symbol, currencyOut?.symbol, inputAmount, outputAmount],
  )

  const smartSettlementTooltip = (
    <div className="text-xs text-subText [&_b]:font-medium [&_b]:text-text">
      <Trans>
        At execution, KyberSwap compares candidate pools on-chain in real time and picks the one that delivers the
        highest output - giving your swap the best possible rate with an extra layer of protection from slippage,
        PropAMM manipulation, Just-in-Time attacks and MEVs. <b>Your minimum amount out is always guaranteed.</b> No
        extra steps needed.
      </Trans>{' '}
      <ExternalLink
        href="https://docs.kyberswap.com/developer-guide/start-here/foundational-solutions/smart-settlement-better-swap-output-with-lower-slippage"
        onClick={event => event.stopPropagation()}
      >
        <Trans>Learn more ↗</Trans>
      </ExternalLink>
    </div>
  )

  const handleToggle = () => {
    const nextExpanded = !isExpanded
    setIsExpanded(nextExpanded)

    if (!nextExpanded || !scrollOnExpand) return

    globalThis.requestAnimationFrame(() => {
      globalThis.requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }

  return (
    <div ref={panelRef} className="overflow-hidden rounded-xl border border-darkBorder">
      <button
        type="button"
        onClick={handleToggle}
        className="group flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-background px-4 py-1.5 text-left text-subText"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <RoutingIcon className="size-[27px] [&_path]:!fill-subText" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-medium text-subText max-sm:hidden">Route:</span>

            {currencyIn ? (
              <div className="flex items-center gap-1.5">
                <CurrencyLogo currency={currencyIn} size="18px" />
                <span className="text-base font-medium text-subText max-sm:text-sm">
                  {titleData.amountIn ? `${titleData.amountIn} ` : ''}
                  {titleData.inputSymbol}
                </span>
              </div>
            ) : null}

            {(currencyIn || currencyOut) && (
              <span className="text-base font-medium text-subText max-sm:text-sm">→</span>
            )}

            {currencyOut ? (
              <div className="flex items-center gap-1.5">
                <CurrencyLogo currency={currencyOut} size="18px" />
                <span className="text-base font-medium text-subText max-sm:text-sm">
                  {titleData.amountOut ? `${titleData.amountOut} ` : ''}
                  {titleData.outputSymbol}
                </span>
              </div>
            ) : null}

            {isSmartSettlementActive && (
              <ClickTooltip text={smartSettlementTooltip} width="360px" placement="top">
                <div
                  role="button"
                  className="flex shrink-0 items-center gap-1 rounded-xl border border-primary-40 bg-primary-12 px-2 py-1 text-sm font-medium text-primary"
                >
                  <ShieldChecked size={14} className="text-primary" />
                  <Trans>Smart Settlement</Trans>
                  <Info size={14} />
                </div>
              </ClickTooltip>
            )}
          </div>
        </div>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-transparent transition-colors duration-150 ease-in-out group-hover:bg-tableHeader">
          <ChevronDown
            size={18}
            className={cn('text-subText transition-transform duration-150 ease-in-out', isExpanded && 'rotate-180')}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-darkBorder p-4">
          <Suspense fallback={<TradeRouteSkeleton />}>
            <TradeRouting
              tradeComposition={tradeComposition}
              currencyIn={currencyIn}
              currencyOut={currencyOut}
              inputAmount={inputAmount}
              outputAmount={outputAmount}
            />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default SwapTradeRoute
