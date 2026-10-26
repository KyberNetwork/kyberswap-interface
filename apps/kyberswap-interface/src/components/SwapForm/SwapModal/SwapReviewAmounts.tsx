import { Currency, Price } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Check, Repeat } from 'react-feather'

import IconButton from 'components/Button/IconButton'
import Dots from 'components/Dots'
import { ErrorWarning } from 'components/ErrorWarning'
import Loader from 'components/Loader'
import { HStack, Stack } from 'components/Stack'
import SwapBrief from 'components/SwapForm/SwapModal/SwapBrief'
import ValueWithLoadingSkeleton from 'components/SwapForm/SwapModal/SwapDetails/ValueWithLoadingSkeleton'
import {
  AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD,
  type SwapReviewAmountsData,
} from 'components/SwapForm/SwapModal/reviewData'
import { cn } from 'utils/cn'

const ExecutionPrice = ({
  executionPrice,
  showInverted,
}: {
  executionPrice?: Price<Currency, Currency>
  showInverted?: boolean
}) => {
  if (!executionPrice) {
    return null
  }

  const inputSymbol = executionPrice.baseCurrency?.symbol
  const outputSymbol = executionPrice.quoteCurrency?.symbol

  const formattedPrice = showInverted ? executionPrice?.invert()?.toSignificant(6) : executionPrice?.toSignificant(6)
  const value = showInverted
    ? `1 ${outputSymbol} = ${formattedPrice} ${inputSymbol}`
    : `1 ${inputSymbol} = ${formattedPrice} ${outputSymbol}`

  return <span className="min-w-max whitespace-nowrap font-medium">{value}</span>
}

const PriceUpdateWarning = ({
  isAccepted,
  level,
  children,
}: {
  isAccepted: boolean
  level: 'warning' | 'error'
  children: React.ReactNode
}) => {
  if (!isAccepted) {
    return <ErrorWarning type={level === 'error' ? 'error' : 'warn'} title={children} />
  }

  return <div className="flex items-center gap-2 rounded-2xl bg-subText/20 px-3 py-2 text-xs">{children}</div>
}

type Props = {
  review: SwapReviewAmountsData
  isBuildingRoute: boolean
  hasAcceptedNewAmount: boolean
  showInverted: boolean
  onInvertRate: () => void
}

const SwapReviewAmounts = ({ review, isBuildingRoute, hasAcceptedNewAmount, showInverted, onInvertRate }: Props) => {
  const {
    outputChangePercent,
    parsedAmountOut,
    parsedAmountOutFromBuild,
    formattedOutputChangePercent,
    isShowAcceptNewAmount,
    details,
    parsedAmountIn,
    amountInUsd,
    amountOutUsdFromBuild,
    level,
  } = review
  return (
    <>
      {outputChangePercent < 0 && (
        <PriceUpdateWarning
          level={outputChangePercent <= AMOUNT_OUT_FROM_BUILD_ERROR_THRESHOLD ? 'error' : 'warning'}
          isAccepted={hasAcceptedNewAmount}
        >
          {hasAcceptedNewAmount && <Check size={20} className="text-text" />}
          <div className={cn('flex-1', hasAcceptedNewAmount && 'text-text')}>
            {hasAcceptedNewAmount ? (
              <Trans>New Amount Accepted</Trans>
            ) : (
              <Trans>
                Due to market conditions, your output has been updated from {parsedAmountOut?.toSignificant(10) || ''}{' '}
                {parsedAmountOut?.currency?.symbol} to {parsedAmountOutFromBuild?.toSignificant(10) || ''}{' '}
                {parsedAmountOut?.currency?.symbol} ({formattedOutputChangePercent}%){' '}
                {isShowAcceptNewAmount ? '. Please accept the new amount before swapping' : ''}
              </Trans>
            )}
          </div>
        </PriceUpdateWarning>
      )}

      <Stack className="gap-1">
        <HStack className="items-center justify-between gap-4">
          <div className="flex min-h-6 items-center gap-1">
            <span className="min-w-max text-xs font-normal text-subText">
              <Trans>Rate:</Trans>
            </span>
            <ValueWithLoadingSkeleton
              skeletonStyle={{ width: '160px' }}
              isShowingSkeleton={isBuildingRoute}
              content={
                details.executionPrice ? (
                  <div className="flex items-center justify-center text-right text-xs font-medium text-text">
                    <ExecutionPrice executionPrice={details.executionPrice} showInverted={showInverted} />
                    <IconButton
                      variant="compact"
                      aria-label="Invert exchange rate"
                      className="hover:brightness-[0.85]"
                      onClick={onInvertRate}
                    >
                      <Repeat size={12} className="text-text" />
                    </IconButton>
                  </div>
                ) : (
                  <p className="text-[12px] font-medium text-text">--</p>
                )
              }
            />
          </div>

          {isBuildingRoute && (
            <div className="flex h-full w-fit items-center gap-1">
              <Loader size="14px" className="text-primary" />
              <span className="text-xs text-subText">
                <Dots>
                  <Trans>Checking price</Trans>
                </Dots>
              </span>
            </div>
          )}
        </HStack>

        {parsedAmountIn && amountInUsd !== undefined && parsedAmountOut && (
          <SwapBrief
            $level={level}
            inputAmount={parsedAmountIn}
            amountInUsd={amountInUsd}
            outputAmount={parsedAmountOut}
            outputAmountFromBuild={parsedAmountOutFromBuild}
            amountOutUsdFromBuild={amountOutUsdFromBuild}
            currencyOut={parsedAmountOut.currency}
            isLoading={isBuildingRoute}
          />
        )}
      </Stack>
    </>
  )
}

export default SwapReviewAmounts
