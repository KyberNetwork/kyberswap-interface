import { Trans } from '@lingui/macro'

import { ErrorWarning } from 'components/ErrorWarning'
import { Stack } from 'components/Stack'
import { QuoteDetailRow, QuoteDetails } from 'components/SwapForm/Quote/QuoteDetails'
import { SwapFee } from 'components/SwapForm/Quote/SwapFee'
import { SwapRate } from 'components/SwapForm/Quote/SwapRate'
import SlippageSetting from 'components/SwapForm/Settings/SlippageSetting'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import type { SwapQuoteRefresh } from 'components/SwapForm/hooks/useSwapQuote'
import { getERC8056DisplayAmount, getERC8056DisplayPrice } from 'hooks/useERC8056Token'
import { useSlippageSettingByPage } from 'state/user/hooks'
import { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { formatDisplayNumber } from 'utils/numbers'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'

type Props = {
  routeSummary?: DetailedRouteSummary
  slippage: number
  loading: boolean
  refresh: SwapQuoteRefresh
  isFeeTampered?: boolean
}
const SingleChainQuoteDetails = ({ routeSummary, slippage, refresh, isFeeTampered, loading }: Props) => {
  const { isSlippageControlPinned } = useSlippageSettingByPage()
  const { inputERC8056Info, outputERC8056Info } = useSwapFormContext()
  const { parsedAmountOut, priceImpact } = routeSummary || {}

  const price = getERC8056DisplayPrice(routeSummary?.executionPrice, inputERC8056Info, outputERC8056Info)
  const rateCurrencyIn = useCurrencyConvertedToNative(price?.baseCurrency)
  const rateCurrencyOut = useCurrencyConvertedToNative(price?.quoteCurrency)

  const priceImpactResult = checkPriceImpact(priceImpact)

  const minimumAmountOut = getERC8056DisplayAmount(
    outputERC8056Info,
    parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined,
  )
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut
      ? `${formatDisplayNumber(minimumAmountOut.toSignificant(10), { significantDigits: 10 })} ${currencyOut.symbol}`
      : '--'

  return (
    <QuoteDetails className="gap-3">
      {isSlippageControlPinned && <SlippageSetting />}
      <SwapRate
        currencyIn={rateCurrencyIn}
        currencyOut={rateCurrencyOut}
        inputChain={rateCurrencyIn?.chainId}
        outputChain={rateCurrencyOut?.chainId}
        rate={price ? formatDisplayNumber(price, { significantDigits: 6 }) : undefined}
        invertedRate={
          price && price.numerator.toString() !== '0'
            ? formatDisplayNumber(price.invert(), { significantDigits: 6 })
            : undefined
        }
        loading={loading}
        refresh={refresh}
      />
      <Stack className="gap-2">
        <QuoteDetailRow
          loading={loading}
          label={<Trans>Minimum Received</Trans>}
          tooltip={
            <>
              <div>
                <Trans>You will receive at least this amount, or your transaction will revert.</Trans>
              </div>
              <div>
                <Trans>
                  Any{' '}
                  <a
                    href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-aggregator/aggregator-api-specification/evm-swaps#kyberswap-positive-slippage-surplus-collection"
                    target="_blank"
                    rel="noreferrer"
                  >
                    positive slippage
                  </a>{' '}
                  will accrue to KyberSwap.
                </Trans>
              </div>
            </>
          }
        >
          <span className="text-[12px] font-medium text-text">{minimumAmountOutStr || '--'}</span>
        </QuoteDetailRow>

        <QuoteDetailRow
          loading={loading}
          label={<Trans>Price Impact</Trans>}
          tooltip={
            <div>
              <Trans>Estimated change in price due to the size of your transaction.</Trans>
              <div className="text-xs">
                <Trans>
                  Read more{' '}
                  <a
                    href="https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/price-impact"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <b>here ↗</b>
                  </a>
                </Trans>
              </div>
            </div>
          }
        >
          <span
            className={cn(
              'text-[12px] font-medium',
              typeof priceImpact !== 'number' || priceImpactResult.isInvalid
                ? 'text-text'
                : priceImpactResult.isVeryHigh
                ? 'text-red'
                : priceImpactResult.isHigh
                ? 'text-warning'
                : 'text-text',
            )}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </span>
        </QuoteDetailRow>

        <SwapFee isFeeTampered={isFeeTampered} loading={loading} />

        {isFeeTampered && (
          <ErrorWarning
            type="warn"
            title={
              <Trans>
                <b>Third-party fee detected</b>
                <br />
                An additional fee appears to have been added by a browser extension or other third-party modification,
                not by KyberSwap. KyberSwap does not charge a flat fee for this trade by default. Please review your
                browser extensions before proceeding.
              </Trans>
            }
          />
        )}
      </Stack>
    </QuoteDetails>
  )
}

export default SingleChainQuoteDetails
