import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AutoColumn } from 'components/Column'
import WarningIcon from 'components/Icons/WarningIcon'
import RefreshLoading from 'components/RefreshLoading'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import useGetFeeConfig from 'components/SwapForm/hooks/useGetFeeConfig'
import { TIP_LINK_CLIENT_ID } from 'components/TipLinkGeneratorModal/shared'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import TradePrice from 'components/swapv2/TradePrice'
import { BIPS_BASE, ClientNameMapping } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'
import { DetailedRouteSummary } from 'types/route'
import { formattedNum, isInSafeApp } from 'utils'
import { cn } from 'utils/cn'
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

  if (clientId === TIP_LINK_CLIENT_ID) {
    const tipRecipientName = feeConfig?.clientName || 'the link sharer'
    return (
      <Trans>
        You&apos;re adding a {feePercent} tip ({feeAmountText}) to this swap for {tipRecipientName}. This is deducted
        from your output - the Est. Output above already includes it. Tips are optional and go directly to the link
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
    const configuredClientName =
      feeConfig.clientName && feeConfig.clientName !== feeConfig.clientId ? feeConfig.clientName : ''
    const tipRecipientName = configuredClientName || ClientNameMapping[feeConfig.clientId || ''] || 'the link sharer'

    return (
      <span className="inline-flex min-w-0 max-w-[180px] items-center align-bottom">
        <span className="shrink-0">
          <Trans>Tip for</Trans>&nbsp;
        </span>
        <span className="min-w-0 truncate">{tipRecipientName}</span>
      </span>
    )
  }

  return <Trans>Est. Swap Fee</Trans>
}

const SwapFee: React.FC<{ isFeeTampered?: boolean }> = ({ isFeeTampered }) => {
  const theme = useTheme()
  const { routeSummary } = useSwapFormContext()
  const feeConfig = useGetFeeConfig()

  const {
    formattedAmount: feeAmount = '',
    formattedAmountUsd: feeAmountUsd = '',
    currency = undefined,
  } = routeSummary?.fee || {}

  if (!feeAmount) {
    return null
  }

  const feeAmountWithSymbol = feeAmount && currency?.symbol ? `${feeAmount} ${currency.symbol}` : ''
  const feeValue = feeAmountUsd || feeAmountWithSymbol || '--'
  const tipFeePercent = feeConfig?.enableTip ? formatSwapFeePercent(routeSummary?.extraFee?.feeAmount) : ''
  const labelColor = isFeeTampered ? theme.warning : theme.subText

  if (isInSafeApp) {
    return (
      <RowBetween>
        <RowFixed>
          <TextDashed fontSize={12} fontWeight={400} color={labelColor}>
            <MouseoverTooltip
              text={
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
            </MouseoverTooltip>
          </TextDashed>
        </RowFixed>

        <RowFixed>
          <p className={cn('m-0 text-[12px] font-medium', isFeeTampered ? 'text-warning' : 'text-text')}>0.1%</p>
        </RowFixed>
      </RowBetween>
    )
  }

  return (
    <RowBetween>
      <RowFixed>
        <TextDashed fontSize={12} fontWeight={400} color={labelColor}>
          <MouseoverTooltip
            text={
              <TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={routeSummary?.extraFee?.feeAmount} />
            }
            placement="right"
          >
            <SwapFeeLabel />
          </MouseoverTooltip>
        </TextDashed>
      </RowFixed>

      <RowFixed>
        <p className={cn('m-0 text-[12px] font-medium', isFeeTampered ? 'text-warning' : 'text-text')}>
          {`${tipFeePercent ? `(${tipFeePercent}) ` : ''}${feeValue}`}
        </p>
      </RowFixed>
    </RowBetween>
  )
}

type Props = {
  routeSummary: DetailedRouteSummary | undefined
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

  const priceImpactResult = checkPriceImpact(priceImpact)

  const minimumAmountOut = parsedAmountOut ? minimumAmountAfterSlippage(parsedAmountOut, slippage) : undefined
  const currencyOut = parsedAmountOut?.currency
  const minimumAmountOutStr =
    minimumAmountOut && currencyOut ? (
      <span className="whitespace-nowrap font-medium text-text">
        {formattedNum(minimumAmountOut.toSignificant(10), false, 10)} {currencyOut.symbol}
      </span>
    ) : (
      ''
    )

  useEffect(() => {
    if (hasTrade) {
      setAlreadyVisible(true)
    }
  }, [hasTrade])

  return (
    <div
      data-visible={alreadyVisible}
      data-disabled={!hasTrade}
      className={cn(
        'hidden w-full max-w-[425px] overflow-hidden rounded-2xl border border-solid border-border p-0 transition-[height,transform] duration-300 ease-in-out',
        'max-h-0',
        'data-[visible=true]:block data-[visible=true]:max-h-max data-[visible=true]:p-3 data-[visible=true]:text-text',
        'data-[disabled=true]:text-subText',
      )}
    >
      <AutoColumn className="gap-3">
        <RowBetween>
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
        </RowBetween>
        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip
                width="200px"
                text={
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
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <RowFixed>
            <p className="m-0 text-[12px] font-medium text-text">{minimumAmountOutStr || '--'}</p>
          </RowFixed>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <TextDashed fontSize={12} fontWeight={400} className="text-subText">
              <MouseoverTooltip
                text={
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
              </MouseoverTooltip>
            </TextDashed>
          </RowFixed>
          <p
            className={cn(
              'm-0 text-[12px] font-medium',
              priceImpactResult.isVeryHigh ? 'text-red' : priceImpactResult.isHigh ? 'text-warning' : 'text-text',
            )}
          >
            {priceImpactResult.isInvalid || typeof priceImpact !== 'number' ? '--' : formatPriceImpact(priceImpact)}
          </p>
        </RowBetween>

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
      </AutoColumn>
    </div>
  )
}

export default TradeSummary
