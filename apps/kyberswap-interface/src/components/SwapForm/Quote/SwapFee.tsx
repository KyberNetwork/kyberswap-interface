import { Trans } from '@lingui/macro'
import { useSearchParams } from 'react-router-dom'

import { QuoteDetailRow } from 'components/SwapForm/Quote/QuoteDetails'
import { useFeeERC8056Info, useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { BIPS_BASE } from 'constants/trade'
import { getERC8056DisplayAmount } from 'hooks/useERC8056Token'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'
import { formatDisplayNumber } from 'utils/numbers'
import { isInSafeApp } from 'utils/safeApp'

export const formatSwapFeePercent = (feeBips: string | undefined) => {
  const parsedFeeBips = Number(feeBips)
  if (!Number.isFinite(parsedFeeBips)) return ''

  return formatDisplayNumber(parsedFeeBips / Number(BIPS_BASE.toString()), {
    style: 'percent',
    fractionDigits: 2,
  })
}

const SwapFeeDocumentationLink = () => (
  <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-superior-rates#swap-fees-supporting-transactions-on-low-trading-volume-chains">
    <b>
      <Trans>here</Trans> ↗
    </b>
  </ExternalLink>
)

type TooltipTextOfSwapFeeProps = {
  feeBips: string | undefined
  feeAmountText: string
}

export const TooltipTextOfSwapFee = ({ feeBips, feeAmountText }: TooltipTextOfSwapFeeProps) => {
  const [searchParams] = useSearchParams()
  const feeConfig = useGetFeeConfig()
  const clientId = searchParams.get('clientId')

  const feePercent = formatSwapFeePercent(feeBips)

  if (!feeAmountText || !feePercent) {
    return (
      <Trans>
        Read more about the fees <SwapFeeDocumentationLink />
      </Trans>
    )
  }

  if (feeConfig?.enableTip) {
    return (
      <Trans>
        You&apos;re adding a {feePercent} tip ({feeAmountText}) to this swap for the link sharer. This is deducted from
        your output - the Est. Output above already includes it. Tips are optional and go directly to the link
        sharer&apos;s wallet.
      </Trans>
    )
  }

  if (clientId) {
    return <Trans>Swap fees charged by {clientId}.</Trans>
  }

  return (
    <Trans>
      A {feePercent} fee ({feeAmountText}) will incur on this swap. The Est. Output amount you see above is inclusive of
      this fee. Read more about the fees <SwapFeeDocumentationLink />
    </Trans>
  )
}

export const SwapFeeLabel = () => {
  const feeConfig = useGetFeeConfig()

  if (feeConfig?.enableTip) {
    return (
      <span className="inline-flex min-w-0 max-w-[180px] items-center align-bottom">
        <span className="shrink-0">
          <Trans>Tip for</Trans>&nbsp;
        </span>
        <span className="min-w-0 truncate">{feeConfig.creatorName || 'the link sharer'}</span>
      </span>
    )
  }

  return <Trans>Est. Swap Fee</Trans>
}

export const SwapFee = ({ isFeeTampered, loading }: { isFeeTampered?: boolean; loading: boolean }) => {
  const { routeSummary } = useSwapFormContext()
  const feeERC8056Info = useFeeERC8056Info()

  const { currencyAmount, currency } = routeSummary?.fee || {}
  const feeAmount = currencyAmount
    ? formatDisplayNumber(getERC8056DisplayAmount(feeERC8056Info, currencyAmount), { significantDigits: 6 })
    : ''
  const feeTokenAddress = currency?.wrapped.address
  const tokenPrices = useTokenPrices(feeTokenAddress ? [feeTokenAddress] : [], currency?.chainId)
  const feeTokenPrice = feeTokenAddress ? tokenPrices[feeTokenAddress] : 0
  const feeAmountUsdText =
    currencyAmount && feeTokenPrice
      ? formatDisplayNumber(Number(currencyAmount.toExact()) * feeTokenPrice, {
          style: 'currency',
          significantDigits: 4,
        })
      : ''

  const feeAmountWithSymbol = feeAmount && currency?.symbol ? `${feeAmount} ${currency.symbol}` : ''
  const feePercent = formatSwapFeePercent(routeSummary?.extraFee?.feeAmount)
  const feeValue = feePercent || feeAmountWithSymbol || '--'

  if (isInSafeApp) {
    return (
      <QuoteDetailRow
        loading={loading}
        label={
          <span className={isFeeTampered ? 'text-warning' : undefined}>
            <Trans>Platform Fee</Trans>
          </span>
        }
        tooltip={
          <span>
            Learn more about the Platform Fee{' '}
            <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-widget/widget-iframe-fee">
              here ↗
            </ExternalLink>
          </span>
        }
      >
        <span className={cn('text-[12px] font-medium', isFeeTampered ? 'text-warning' : 'text-text')}>
          {routeSummary ? '0.1%' : '--'}
        </span>
      </QuoteDetailRow>
    )
  }

  return (
    <QuoteDetailRow
      loading={loading}
      label={
        <span className={isFeeTampered ? 'text-warning' : undefined}>
          <SwapFeeLabel />
        </span>
      }
      tooltip={<TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={routeSummary?.extraFee?.feeAmount} />}
    >
      <span
        className={cn(
          'flex flex-nowrap items-center gap-1 text-[12px] font-medium',
          isFeeTampered ? 'text-warning' : 'text-text',
        )}
      >
        <span>{feeValue}</span>
        {feePercent && feeAmountUsdText && <span className="text-subText">(~{feeAmountUsdText})</span>}
      </span>
    </QuoteDetailRow>
  )
}
