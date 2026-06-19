import { Currency, CurrencyAmount, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { useEffect } from 'react'
import { parseGetRouteResponse } from 'services/route/utils'

import { removeTrailingZero } from 'components/LimitOrder/helpers'
import Skeleton from 'components/Skeleton'
import { HStack, Stack } from 'components/Stack'
import useGetRoute from 'components/SwapForm/hooks/useGetRoute'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'

const formatPriceRate = (price: Price<Currency, Currency> | undefined) =>
  price
    ? `1 ${price.baseCurrency.symbol} = ${removeTrailingZero(price.toSignificant(8))} ${price.quoteCurrency.symbol}`
    : '--'

const DetailRow = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <HStack className="min-h-6 items-center justify-between gap-3 text-sm max-sm:flex-col max-sm:items-start">
    <span className="shrink-0 text-subText">{label}</span>
    <div className="min-w-0 max-w-full text-right font-medium text-text max-sm:text-left">{children}</div>
  </HStack>
)

type Props = {
  isSwapBetter: boolean
  inputCurrency: Currency
  outputCurrency: Currency
  inputAmount: CurrencyAmount<Currency> | undefined
  outputAmount: CurrencyAmount<Currency> | undefined
}

const RateComparison = ({ isSwapBetter, inputCurrency, outputCurrency, inputAmount, outputAmount }: Props) => {
  const {
    fetcher: getSwapRoute,
    result: swapRouteResult,
    isLoading: swapRouteLoading,
  } = useGetRoute({
    currencyIn: inputCurrency,
    currencyOut: outputCurrency,
    parsedAmount: inputAmount,
    customChain: inputCurrency.wrapped.chainId,
  })

  const swapRouteSummary = (() => {
    if (!swapRouteResult.data?.data || swapRouteResult.error) return undefined

    return parseGetRouteResponse(swapRouteResult.data.data, inputCurrency, outputCurrency).routeSummary
  })()

  const orderExecutionPrice = (() => {
    if (!inputAmount || !outputAmount) return undefined
    if (inputAmount.equalTo(0) || outputAmount.equalTo(0)) return undefined

    return new Price(inputCurrency, outputCurrency, inputAmount.quotient, outputAmount.quotient)
  })()

  const swapRouteOutputDelta = (() => {
    if (!swapRouteSummary?.parsedAmountOut || !outputAmount) return undefined

    const swapOutput = Number(swapRouteSummary.parsedAmountOut.toExact())
    const orderOutput = Number(outputAmount.toExact())
    if (!swapOutput || !orderOutput) return undefined

    return (swapOutput / orderOutput - 1) * 100
  })()

  const isSwapRouteBetter =
    !!swapRouteSummary?.parsedAmountOut && !!outputAmount && swapRouteSummary.parsedAmountOut.greaterThan(outputAmount)
  const showSwapRouteSkeleton = swapRouteLoading
  const showSwapOfferNotice = showSwapRouteSkeleton ? isSwapBetter : isSwapRouteBetter

  useEffect(() => {
    if (!inputAmount || inputAmount.equalTo(0)) return
    getSwapRoute()
  }, [getSwapRoute, inputAmount])

  return (
    <Stack className="overflow-hidden rounded-xl bg-buttonGray">
      <span className="px-4 py-3 text-xs font-medium uppercase text-subText">
        <Trans>Rate Comparison</Trans>
      </span>
      <Stack className="gap-2 border-t border-white-08 px-4 py-3">
        <DetailRow label={<Trans>This order (after fee)</Trans>}>{formatPriceRate(orderExecutionPrice)}</DetailRow>
        <DetailRow label={<Trans>Swap best route</Trans>}>
          <HStack className="min-w-0 justify-end gap-1 max-sm:justify-start">
            <span className="truncate">
              {showSwapRouteSkeleton ? (
                <Skeleton height={16} width={160} variant="darkSubtle" />
              ) : (
                formatPriceRate(swapRouteSummary?.executionPrice)
              )}
            </span>
            {!showSwapRouteSkeleton && swapRouteOutputDelta !== undefined && (
              <span className={cn('shrink-0', isSwapRouteBetter ? 'text-primary' : 'text-red')}>
                {swapRouteOutputDelta > 0 ? '+' : ''}
                {formatDisplayNumber(swapRouteOutputDelta, {
                  significantDigits: 4,
                  allowDisplayNegative: true,
                })}
                %
              </span>
            )}
          </HStack>
        </DetailRow>
        {showSwapOfferNotice && (
          <span className="text-sm italic text-blue">
            💡 <Trans>Swap offers a better rate. You can still fill this order directly if you prefer.</Trans>
          </span>
        )}
      </Stack>
    </Stack>
  )
}

export default RateComparison
