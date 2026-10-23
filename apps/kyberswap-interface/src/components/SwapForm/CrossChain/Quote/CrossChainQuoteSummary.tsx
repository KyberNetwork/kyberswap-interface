import { Trans, t } from '@lingui/macro'
import { formatUnits } from 'viem'

import { ErrorWarning } from 'components/ErrorWarning'
import type { getQuoteWarning } from 'components/SwapForm/CrossChain/hooks/getQuoteWarning'
import { QuoteDetailRow } from 'components/SwapForm/Quote/QuoteDetails'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Currency } from 'pages/CrossChainSwap/adapters/types'
import { getMinimumOutputAmount } from 'pages/CrossChainSwap/quote/utils'
import { Quote } from 'pages/CrossChainSwap/registry'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

export const formatTime = (seconds: number) => {
  if (seconds <= 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}m${secs > 0 ? secs + 's' : ''}`
}

type CrossChainQuoteSummaryProps = {
  slippage: number
  warning?: ReturnType<typeof getQuoteWarning>
  quote?: Quote
  tokenOut?: Currency
  loading?: boolean
  full?: boolean
  showSlippage?: boolean
}

export const CrossChainQuoteSummaryRows = ({
  quote,
  tokenOut,
  slippage,
  warning,
  full,
  showSlippage = true,
  loading = false,
}: CrossChainQuoteSummaryProps) => {
  const currencyIn = quote?.quote.quoteParams.fromToken
  const initialLoading = loading && !quote

  const theme = useTheme()
  const minimumReceived = quote && tokenOut ? formatUnits(getMinimumOutputAmount(quote.quote), tokenOut.decimals) : '--'

  return (
    <>
      {full && (
        <QuoteDetailRow label={t`Current price`}>
          1 {currencyIn?.symbol} = {formatDisplayNumber(quote?.quote.rate, { significantDigits: 8 })} {tokenOut?.symbol}
        </QuoteDetailRow>
      )}

      <QuoteDetailRow
        loading={initialLoading}
        label={t`Minimum Received`}
        tooltip={t`You will receive at least this amount or your transaction will revert.`}
      >
        {quote && tokenOut
          ? `${formatDisplayNumber(minimumReceived, { significantDigits: 8 })} ${tokenOut.symbol}`
          : '--'}
      </QuoteDetailRow>
      <QuoteDetailRow
        loading={initialLoading}
        label={t`Estimated Processing Time`}
        tooltip={t`Estimated processing time for your transaction.`}
      >
        {quote ? `~${formatTime(quote.quote.timeEstimate)}` : '--'}
      </QuoteDetailRow>

      <QuoteDetailRow
        loading={initialLoading}
        label={t`Price Impact`}
        tooltip={t`Estimated change in price due to the size of your transaction.`}
      >
        <span
          style={{
            color: warning?.priceImpactInfo?.isVeryHigh
              ? theme.red
              : warning?.priceImpactInfo?.isHigh
              ? theme.warning
              : undefined,
          }}
        >
          {quote
            ? quote.quote.priceImpact === null || !Number.isFinite(quote.quote.priceImpact)
              ? '--'
              : `${quote.quote.priceImpact < 0.01 ? '<0.01' : Math.abs(quote.quote.priceImpact).toFixed(2)}%`
            : '--'}
        </span>
      </QuoteDetailRow>

      {quote && (quote.quote.additionalFeeUsd ?? 0) > 0 && (
        <QuoteDetailRow
          loading={initialLoading}
          label={t`Additional Fee`}
          tooltip={<Trans>Additional fee charged by {quote.adapter.getName()}</Trans>}
        >
          {formatDisplayNumber(quote.quote.additionalFeeUsd, { style: 'currency', fractionDigits: 2 })}
        </QuoteDetailRow>
      )}

      <QuoteDetailRow
        loading={initialLoading}
        label={t`Platform Fee`}
        tooltip={
          <span>
            <Trans>
              Check more details{' '}
              <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/cross-chain-swap">
                here
              </ExternalLink>
            </Trans>
          </span>
        }
      >
        {quote ? `${quote.quote.platformFeePercent.toFixed(2)}%` : '--'}
      </QuoteDetailRow>

      {showSlippage && (
        <QuoteDetailRow
          label={t`Max Slippage`}
          tooltip={
            <span>
              <Trans>
                During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                <ExternalLink
                  href={'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'}
                >
                  here ↗
                </ExternalLink>
              </Trans>
            </span>
          }
        >
          <MouseoverTooltip text={warning?.slippageInfo.message}>
            <span
              style={{
                color: warning?.slippageInfo.message ? theme.warning : undefined,
                textDecoration: warning?.slippageInfo.message ? 'underline' : undefined,
                textDecorationStyle: 'dotted',
                textUnderlineOffset: '4px',
              }}
            >
              {((slippage * 100) / 10_000).toFixed(2)}%
            </span>
          </MouseoverTooltip>
        </QuoteDetailRow>
      )}
    </>
  )
}

type SummaryProps = CrossChainQuoteSummaryProps

export const CrossChainQuoteSummary = (props: SummaryProps) => (
  <div className="flex flex-col gap-3 rounded-2xl border border-solid border-border p-4 text-xs">
    <CrossChainQuoteSummaryRows {...props} />
  </div>
)

export const CrossChainPriceImpactWarning = ({ warning }: { warning: ReturnType<typeof getQuoteWarning> }) => {
  if (!warning?.priceImpactInfo?.message) return null

  return (
    <ErrorWarning
      type={warning.priceImpactInfo.isVeryHigh ? 'error' : 'warn'}
      title={warning.priceImpactInfo.message}
    />
  )
}
