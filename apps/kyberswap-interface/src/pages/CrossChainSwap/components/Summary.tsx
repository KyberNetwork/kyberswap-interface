import { Trans, t } from '@lingui/macro'
import { formatUnits } from 'viem'

import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { formatDisplayNumber } from 'utils/numbers'

import { Currency } from '../adapters'
import { useCrossChainSwap } from '../hooks/useCrossChainSwap'
import { Quote } from '../registry'

const DOTTED_LABEL = 'border-b border-dotted border-border text-subText'

export const formatTime = (seconds: number) => {
  if (seconds <= 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}m${secs > 0 ? secs + 's' : ''}`
}

export const Summary = ({ quote, tokenOut, full }: { quote?: Quote; tokenOut?: Currency; full?: boolean }) => {
  const [slippage] = useUserSlippageTolerance()

  const { currencyIn, warning } = useCrossChainSwap()

  const theme = useTheme()
  const minimumReceived =
    quote && tokenOut
      ? formatUnits((quote.quote.outputAmount * (10000n - BigInt(slippage))) / 10000n, tokenOut.decimals)
      : '--'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-solid border-border p-4 text-xs">
      {full && (
        <div className="flex justify-between">
          <span className="text-subText">{t`Current price`}</span>
          <span>
            1 {currencyIn?.symbol} = {formatDisplayNumber(quote?.quote.rate, { significantDigits: 8 })}{' '}
            {tokenOut?.symbol}
          </span>
        </div>
      )}

      <div className="flex justify-between">
        <MouseoverTooltip text={t`You will receive at least this amount or your transaction will revert.`}>
          <span className={DOTTED_LABEL}>{t`Minimum Received`}</span>
        </MouseoverTooltip>
        <span>
          {formatDisplayNumber(minimumReceived, { significantDigits: 8 })} {tokenOut?.symbol}
        </span>
      </div>
      <div className="flex justify-between">
        <MouseoverTooltip text={t`Estimated processing time for your transaction.`}>
          <span className={DOTTED_LABEL}>{t`Estimated Processing Time`}</span>
        </MouseoverTooltip>
        <span>{quote ? `~${formatTime(quote.quote.timeEstimate)}` : '--'}</span>
      </div>

      <div className="flex justify-between">
        <MouseoverTooltip text={t`Estimated change in price due to the size of your transaction.`}>
          <span className={DOTTED_LABEL}>{t`Price Impact`}</span>
        </MouseoverTooltip>
        <span
          style={{
            color: warning?.priceImpaceInfo?.isVeryHigh
              ? theme.red
              : warning?.priceImpaceInfo?.isHigh
              ? theme.warning
              : undefined,
          }}
        >
          {quote
            ? !quote.quote.priceImpact
              ? '--'
              : `${quote.quote.priceImpact < 0.01 ? '<0.01' : Math.abs(quote.quote.priceImpact).toFixed(2)}%`
            : '--'}
        </span>
      </div>

      {quote && quote.quote.protocolFee > 0 && (
        <div className="flex justify-between">
          <MouseoverTooltip text={<Trans>Additional fee charged by {quote.adapter.getName()}</Trans>}>
            <span className={DOTTED_LABEL}>{t`Protocol Fee`}</span>
          </MouseoverTooltip>
          <span>{formatDisplayNumber(quote.quote.protocolFee, { style: 'currency', fractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex justify-between">
        <MouseoverTooltip
          text={
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
          <span className={DOTTED_LABEL}>{t`Platform Fee`}</span>
        </MouseoverTooltip>
        <span>{quote ? `${quote.quote.platformFeePercent.toFixed(2)}%` : '--'}</span>
      </div>

      <div className="flex justify-between">
        <MouseoverTooltip
          placement="right"
          text={
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
          <span className={DOTTED_LABEL}>{t`Max Slippage`}</span>
        </MouseoverTooltip>

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
      </div>
    </div>
  )
}
