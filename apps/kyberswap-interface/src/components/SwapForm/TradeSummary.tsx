import { Trans } from '@lingui/macro'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AutoColumn } from 'components/Column'
import WarningIcon from 'components/Icons/WarningIcon'
import RefreshLoading from 'components/RefreshLoading'
import { RowBetween, RowFixed } from 'components/Row'
import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import TradePrice from 'components/swapv2/TradePrice'
import { BIPS_BASE } from 'constants/index'
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
export const TooltipTextOfSwapFee: React.FC<TooltipTextOfSwapFeeProps> = ({ feeBips, feeAmountText }) => {
  const [searchParams] = useSearchParams()
  const clientId = searchParams.get('clientId')

  const feePercent = formatDisplayNumber(Number(feeBips) / Number(BIPS_BASE.toString()), {
    style: 'percent',
    fractionDigits: 2,
  })
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

const SwapFee: React.FC<{ isFeeTampered?: boolean }> = ({ isFeeTampered }) => {
  const theme = useTheme()
  const { routeSummary } = useSwapFormContext()

  const {
    formattedAmount: feeAmount = '',
    formattedAmountUsd: feeAmountUsd = '',
    currency = undefined,
  } = routeSummary?.fee || {}

  if (!feeAmount) {
    return null
  }

  const feeAmountWithSymbol = feeAmount && currency?.symbol ? `${feeAmount} ${currency.symbol}` : ''
  const labelColor = isFeeTampered ? theme.warning : theme.subText
  const valueColor = isFeeTampered ? theme.warning : theme.text

  return (
    <RowBetween>
      <RowFixed>
        <TextDashed fontSize={12} fontWeight={400} color={labelColor}>
          <MouseoverTooltip
            text={
              isInSafeApp ? (
                <span>
                  Learn more about the Platform Fee{' '}
                  <ExternalLink href="https://docs.kyberswap.com/kyberswap-solutions/kyberswap-widget/widget-iframe-fee">
                    here ↗
                  </ExternalLink>
                </span>
              ) : (
                <TooltipTextOfSwapFee feeAmountText={feeAmountWithSymbol} feeBips={routeSummary?.extraFee?.feeAmount} />
              )
            }
            placement="right"
          >
            {isInSafeApp ? 'Platform Fee' : <Trans>Est. Swap Fee</Trans>}
          </MouseoverTooltip>
        </TextDashed>
      </RowFixed>

      <RowFixed>
        <p className="m-0 text-[12px] font-medium" style={{ color: valueColor }}>
          {isInSafeApp ? '0.1%' : feeAmountUsd || feeAmountWithSymbol || '--'}
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
  const theme = useTheme()
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
            className="m-0 text-[12px] font-medium"
            style={{
              color: priceImpactResult.isVeryHigh ? theme.red : priceImpactResult.isHigh ? theme.warning : theme.text,
            }}
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
