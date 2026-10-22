import { ChainId, type Currency, type CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Suspense, lazy, useMemo } from 'react'
import { Info } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import { ShieldChecked } from 'components/Icons'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import { ClickTooltip } from 'components/Tooltip'
import { getERC8056DisplayAmount, useERC8056TokenInfo } from 'hooks/useERC8056Token'
import TradeRoutePanel from 'pages/Swap/components/TradeRoutePanel'
import { ExternalLink } from 'theme'
import { type SwapRouteV2, type SwapRouteV3 } from 'utils/aggregationRouting'

const TradeRouting = lazy(() => import('components/TradeRouting'))

const TradeRouteSkeleton = () => {
  return (
    <Stack className="gap-10 py-3">
      <HStack className="items-center justify-between gap-4">
        <Skeleton height={24} variant="darkSubtle" width={108} />
        <Skeleton height={24} variant="darkSubtle" width={108} />
      </HStack>

      <HStack className="justify-evenly gap-3">
        {[0, 1].map(index => (
          <Stack key={index} className="w-[180px] gap-3 rounded-xl border border-darkBorder p-3">
            <Skeleton height={20} variant="darkSubtle" width={96} />
            <Skeleton height={28} variant="darkSubtle" width="100%" />
          </Stack>
        ))}
      </HStack>
    </Stack>
  )
}

/** Presents single-chain pool/split composition inside the shared route shell; does not fetch or select routes. */
type SwapTradeRouteProps = {
  tradeComposition: SwapRouteV2[] | SwapRouteV3[] | undefined
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
  defaultCollapsed?: boolean
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
  isSmartSettlement?: boolean
  scrollOnExpand?: boolean
  onExpand?: () => void
}

const SwapTradeRoute = ({
  tradeComposition,
  currencyIn,
  currencyOut,
  defaultCollapsed = false,
  inputAmount: rawInputAmount,
  outputAmount: rawOutputAmount,
  isSmartSettlement = false,
  scrollOnExpand = true,
  onExpand,
}: SwapTradeRouteProps) => {
  // Amounts are labels only, so an ERC-8056 token shows them in display units like the swap form.
  const inputInfo = useERC8056TokenInfo(currencyIn, currencyIn?.chainId ?? ChainId.MAINNET)
  const outputInfo = useERC8056TokenInfo(currencyOut, currencyOut?.chainId ?? ChainId.MAINNET)
  const inputAmount = useMemo(() => getERC8056DisplayAmount(inputInfo, rawInputAmount), [inputInfo, rawInputAmount])
  const outputAmount = useMemo(
    () => getERC8056DisplayAmount(outputInfo, rawOutputAmount),
    [outputInfo, rawOutputAmount],
  )

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

  return (
    <TradeRoutePanel
      defaultCollapsed={defaultCollapsed}
      scrollOnExpand={scrollOnExpand}
      onExpand={onExpand}
      heading={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-medium text-blue max-sm:hidden">Route:</span>

          {currencyIn ? (
            <div className="flex items-center gap-1.5">
              <CurrencyLogo currency={currencyIn} size="18px" />
              <span className="text-base font-medium text-subText max-sm:text-sm">
                {titleData.amountIn ? `${titleData.amountIn} ` : ''}
                {titleData.inputSymbol}
              </span>
            </div>
          ) : null}

          {(currencyIn || currencyOut) && <span className="text-base font-medium text-subText max-sm:text-sm">→</span>}

          {currencyOut ? (
            <div className="flex items-center gap-1.5">
              <CurrencyLogo currency={currencyOut} size="18px" />
              <span className="text-base font-medium text-subText max-sm:text-sm">
                {titleData.amountOut ? `${titleData.amountOut} ` : ''}
                {titleData.outputSymbol}
              </span>
            </div>
          ) : null}

          {isSmartSettlement && (
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
      }
    >
      <Suspense fallback={<TradeRouteSkeleton />}>
        <TradeRouting
          customChainId={currencyIn?.chainId}
          tradeComposition={tradeComposition}
          currencyIn={currencyIn}
          currencyOut={currencyOut}
          inputAmount={inputAmount}
          outputAmount={outputAmount}
        />
      </Suspense>
    </TradeRoutePanel>
  )
}

export default SwapTradeRoute
