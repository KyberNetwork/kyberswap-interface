import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import WarningIcon from 'components/Icons/WarningIcon'
import RefreshLoading from 'components/RefreshLoading'
import { HStack, Stack } from 'components/Stack'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { TextHelper } from 'components/Text'
import TradePrice from 'components/TradePrice'
import { BIPS_BASE } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { ExternalLink } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { cn } from 'utils/cn'
import { isInSafeApp } from 'utils/common'
import { minimumAmountAfterSlippage } from 'utils/currencyAmount'
import { formatDisplayNumber } from 'utils/numbers'
import { checkPriceImpact, formatPriceImpact } from 'utils/prices'

type TooltipTextOfSwapFeeProps = {
  feeBips: string | undefined
  feeAmountText: string
}

export const formatSwapFeePercent = (feeBips: string | undefined) => {
  const parsedFeeBips = Number(feeBips)
  if (!Number.isFinite(parsedFeeBips)) return ''

  return formatDisplayNumber(parsedFeeBips / Number(BIPS_BASE.toString()), {
    style: 'percent',
    fractionDigits: 2,
  })
}

export const TooltipTextOfSwapFee: React.FC<TooltipTextOfSwapFeeProps> = ({ feeBips, feeAmountText }) => {
  const [searchParams] = useSearchParams()
  const feeConfig = useGetFeeConfig()
  const clientId = searchParams.get('clientId')

  const feePercent = formatSwapFeePercent(feeBips)
  const hereLink = (
    <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-interface/user-guides/instantly-swap-at-superior-rates#swap-fees-supporting-transactions-on-low-trading-volume-chains">
      <b>
        <Trans>here</Trans> ↗
      </b>
    </ExternalLink>
  )

  if (!feeAmountText || !feePercent) {
    return <Trans>Read more about the fees {hereLink}</Trans>
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
      this fee. Read more about the fees {hereLink}
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

const SwapFee: React.FC<{ isFeeTampered?: boolean }> = ({ isFeeTampered }) => {
  const theme = useTheme()
  const { routeSummary } = useSwapFormContext()

  const { formattedAmount: feeAmount = '', currencyAmount, currency } = routeSummary?.fee || {}
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

  if (!feeAmount) {
    return null
  }

  const feeAmountWithSymbol = feeAmount && currency?.symbol ? `${feeAmount} ${currency.symbol}` : ''
  const feePercent = formatSwapFeePercent(routeSummary?.extraFee?.feeAmount)
  const feeValue = feePercent || feeAmountWithSymbol || '--'
  const labelColor = isFeeTampered ? theme.warning : theme.subText

  if (isInSafeApp) {
    return (
      <HStack className="w-full items-center justify-between">
        <HStack className="w-fit items-center">
          <TextHelper
            fontSize={12}
            color={labelColor}
            tooltip={
              <span>
                Learn more about the Platform Fee{' '}
                <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-widget/widget-iframe-fee">
                  here ↗
                </ExternalLink>
              </span>
            }
            placement="right"
          >
            Platform Fee
          </TextHelper>
        </HStack>

        <HStack className="w-fit items-center">
          <p className={cn('m-0 text-[12px] font-medium', isFeeTampered ? 'text-warning' : 'text-text')}>0.1%</p>
        </HStack>
      </HStack>
    )
  }

  return (
    <HStack className="w-full items-center justify-between">
      <HStack className="w-fit items-center">
        <TextHelper
          fontSize={12}
          color={labelColor}
          tooltip={
            <TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={routeSummary?.extraFee?.feeAmount} />
          }
          placement="right"
        >
          <SwapFeeLabel />
        </TextHelper>
      </HStack>

      <HStack className="w-fit items-center">
        <p
          className={cn(
            'm-0 flex flex-nowrap items-center gap-1 text-[12px] font-medium',
            isFeeTampered ? 'text-warning' : 'text-text',
          )}
        >
          <span>{feeValue}</span>
          {feePercent && feeAmountUsdText && <span className="text-subText">(~{feeAmountUsdText})</span>}
        </p>
      </HStack>
    </HStack>
  )
}

type Props = {
  routeSummary?: DetailedRouteSummary
  slippage: number
  disableRefresh: boolean
  routeLoading: boolean
  refreshCallback: () => void
  isFeeTampered?: boolean
}
const TradeSummary: React.FC<Props> = ({
  routeSummary,
  slippage,
  disableRefresh,
  refreshCallback,
  routeLoading,
  isFeeTampered,
}) => {
  const [alreadyVisible, setAlreadyVisible] = useState(false)
  const { parsedAmountOut, priceImpact } = routeSummary || {}
  const hasTrade = !!routeSummary?.route

  useEffect(() => {
    if (hasTrade) {
      setAlreadyVisible(true)
    }
  }, [hasTrade])

  const hidden = !alreadyVisible
  const priceImpactResult = checkPriceImpact(priceImpact)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <span className="whitespace-nowrap font-medium text-text">
        {formatDisplayNumber(minimumAmountOut.toSignificant(10), { significantDigits: 10 })} {currencyOut.symbol}
      </span>
    ) : (
      ''
    )

  return (
    <div
      className={cn(
        'w-full max-w-[425px] overflow-hidden rounded-2xl border border-border/60 p-3 text-text',
        hidden && 'hidden',
      )}
    >
      <Stack className="gap-3">
        <HStack className="min-h-[19px] w-full items-center justify-between">
          <span className="text-xs font-normal text-subText">
            <Trans>Rate</Trans>
          </span>

          <div className="-my-1 flex items-center gap-1">
            <RefreshLoading
              refetchLoading={routeLoading}
              onRefresh={refreshCallback}
              disableRefresh={disableRefresh}
              clickable
            />
            <TradePrice price={routeSummary?.executionPrice} className="text-text" />
          </div>
        </HStack>
        <HStack className="w-full items-center justify-between">
          <HStack className="w-fit items-center">
            <TextHelper
              fontSize={12}
              fontWeight={400}
              className="text-subText"
              tooltipWidth="280px"
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
              placement="right"
            >
              <Trans>Minimum Received</Trans>
            </TextHelper>
          </HStack>
          <HStack className="w-fit items-center">
            <p className="m-0 text-[12px] font-medium text-text">{minimumAmountOutStr || '--'}</p>
          </HStack>
        </HStack>

        <HStack className="w-full items-center justify-between">
          <HStack className="w-fit items-center">
            <TextHelper
              fontSize={12}
              fontWeight={400}
              className="text-subText"
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
              placement="right"
            >
              <Trans>Price Impact</Trans>
            </TextHelper>
          </HStack>
          <p
            className={cn(
              'm-0 text-[12px] font-medium',
              priceImpactResult.isVeryHigh ? 'text-red' : priceImpactResult.isHigh ? 'text-warning' : 'text-text',
            )}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </p>
        </HStack>

        <SwapFee isFeeTampered={isFeeTampered} />

        {isFeeTampered && (
          <div className="flex gap-2 rounded-xl bg-warning-30 px-3 py-2.5">
            <WarningIcon className="text-warning" size={16} />
            <span className="flex-1 text-xs">
              <Trans>
                <b>Third-party fee detected</b>
                <br />
                An additional fee appears to have been added by a browser extension or other third-party modification,
                not by KyberSwap. KyberSwap does not charge a flat fee for this trade by default. Please review your
                browser extensions before proceeding.
              </Trans>
            </span>
          </div>
        )}
      </Stack>
    </div>
  )
}

export default TradeSummary
