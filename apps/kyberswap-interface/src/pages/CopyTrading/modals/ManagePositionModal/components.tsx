import { useState } from 'react'
import { AlertTriangle, ArrowDown, Repeat, RotateCw } from 'react-feather'
import type { PendingSellObligation } from 'services/copyTrading/types/copyRuns'
import type { PositionSummary } from 'services/copyTrading/types/positions'
import type { PositionSellPreview, PreparedToken, RawAmountMetric } from 'services/copyTrading/types/preparedActions'

import Skeleton from 'components/Skeleton'
import TextSkeleton from 'components/Skeleton/TextSkeleton'
import { Stack } from 'components/Stack'
import CopyTradingTokenLogo from 'pages/CopyTrading/components/common/TokenLogo'
import { ShortenedId } from 'pages/CopyTrading/components/common/layout'
import { formatApproximateUsd } from 'pages/CopyTrading/helpers'
import { PreparedActionFormActions, ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import PreparedActionSlippageControl from 'pages/CopyTrading/modals/PreparedActionModal/SlippageControl'
import {
  formatPreparedAmount,
  formatPreparedExactAmountValue,
  formatPreparedRate,
  formatSlippage,
  formatWadPercent,
  withMetricFallback,
} from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { formatDateTime } from 'utils/time'

const withApproximateMetricFallback = (value: string) => (value === '—' ? 'N/A' : `~${value}`)

const formatSkipReason = (value?: string) =>
  value
    ?.replace(/^.*_ERROR_/, '')
    .replaceAll('_', ' ')
    .toLowerCase() || 'N/A'

type TokenAmountPanelProps = {
  amount?: RawAmountMetric
  chainId: number
  isLoading: boolean
  label: string
  token?: PreparedToken
}

const TokenAmountPanel = ({ amount, chainId, isLoading, label, token }: TokenAmountPanelProps) => {
  const value = withMetricFallback(formatPreparedExactAmountValue(amount, token))

  return (
    <Stack className="gap-2 rounded-xl bg-white-04 p-3">
      <span className="text-sm font-medium text-subText">{label}</span>
      <div className="flex min-w-0 items-center justify-between gap-4">
        <span className="min-w-0 flex-1 truncate text-xl font-medium text-text" title={isLoading ? undefined : value}>
          {isLoading ? <Skeleton width={112} height={28} variant="darkSubtle" /> : value}
        </span>
        <div className="flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-full bg-white-08 py-1 pl-1.5 pr-2.5">
          <CopyTradingTokenLogo fallbackChainId={chainId} token={token} />
          <span className="truncate text-sm font-medium text-text">{token?.symbol || 'Token'}</span>
        </div>
      </div>
    </Stack>
  )
}

const getPreparedBaseToken = (position: PositionSummary, token?: PreparedToken): PreparedToken => ({
  address: token?.address ?? position.token.address,
  chainId: token?.chainId ?? String(position.chainId),
  decimals: token?.decimals ?? position.token.decimals,
  logoUrl: token?.logoUrl ?? position.token.iconUrl,
  name: token?.name ?? position.token.name,
  symbol: token?.symbol ?? position.token.symbol,
})

export const ManagePositionReview = ({
  isLoading,
  onRefresh,
  position,
  preview,
}: {
  isLoading: boolean
  onRefresh: () => void
  position: PositionSummary
  preview?: PositionSellPreview
}) => {
  const [invertedRate, setInvertedRate] = useState(false)

  const showSkeleton = isLoading && !preview
  const baseToken = getPreparedBaseToken(position, preview?.baseToken)
  const rate = withMetricFallback(
    formatPreparedRate(
      invertedRate ? preview?.swapQuote?.expectedQuote : preview?.sellBase,
      invertedRate ? preview?.quoteToken : baseToken,
      invertedRate ? preview?.sellBase : preview?.swapQuote?.expectedQuote,
      invertedRate ? baseToken : preview?.quoteToken,
    ),
  )

  return (
    <Stack className="gap-3">
      <Stack className="relative gap-1">
        <TokenAmountPanel
          amount={preview?.sellBase}
          chainId={position.chainId}
          isLoading={showSkeleton}
          label="You Sell"
          token={baseToken}
        />
        <div className="absolute left-1/2 top-1/2 z-[1] flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg border-4 border-tableHeader bg-[#3a3a3a] text-subText">
          <ArrowDown size={14} />
        </div>
        <TokenAmountPanel
          amount={preview?.swapQuote?.expectedQuote}
          chainId={position.chainId}
          isLoading={showSkeleton}
          label="You Receive"
          token={preview?.quoteToken}
        />
      </Stack>

      <div className="flex min-w-0 items-center gap-1 text-sm">
        <button
          type="button"
          className="mr-1 flex shrink-0 items-center text-subText hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Refresh rate"
          title="Refresh rate"
          disabled={isLoading}
          onClick={onRefresh}
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : undefined} />
        </button>
        <span className="shrink-0 font-medium text-subText">Rate:</span>
        <span className="truncate font-medium text-text">
          {showSkeleton ? <Skeleton width={96} height={16} variant="darkSubtle" /> : rate}
        </span>
        <button
          type="button"
          className="ml-1 flex shrink-0 items-center text-subText hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Invert rate"
          title="Invert rate"
          disabled={isLoading || rate === 'N/A'}
          onClick={() => setInvertedRate(value => !value)}
        >
          <Repeat size={14} />
        </button>
      </div>

      <ReviewSection>
        <ReviewRow
          isLoading={showSkeleton}
          label="Portion To Sell"
          value={withMetricFallback(formatWadPercent(preview?.sellRatioRaw))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Minimum Received"
          value={withMetricFallback(formatPreparedAmount(preview?.swapQuote?.minimumQuote, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Cashback"
          value={withApproximateMetricFallback(formatPreparedAmount(preview?.cashback, preview?.quoteToken))}
        />
        <ReviewRow
          isLoading={showSkeleton}
          label="Effective Slippage"
          value={withMetricFallback(formatSlippage(preview?.swapQuote?.effectiveSlippageBps))}
        />
      </ReviewSection>
    </Stack>
  )
}

type ManagePositionFormProps = {
  isPreparing: boolean
  onCancel: () => void
  onPrimaryAction: () => void
  onSlippageChange: (slippage: number) => void
  position: PositionSummary
  preview?: PositionSellPreview
  previewError?: string
  previewLoading: boolean
  pendingSellObligations?: PendingSellObligation[]
  pendingSellObligationsError?: string
  pendingSellObligationsLoading: boolean
  primaryActionDisabled: boolean
  primaryActionLabel: string
  primaryActionLoading: boolean
  showClosePositionSummary: boolean
  slippage: number
  unavailableMessage?: string
}

export const ManagePositionTitle = ({
  actionLabel,
  isReview,
  showSkippedActions,
}: {
  actionLabel: string
  isReview: boolean
  showSkippedActions: boolean
}) => {
  if (isReview) return <>Review Sell</>
  if (!showSkippedActions) return <>{actionLabel}</>

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <AlertTriangle size={20} className="shrink-0 text-warning" />
      <h2 className="truncate text-xl font-medium text-text" title="Sell Actions Skipped">
        Sell Actions Skipped
      </h2>
    </div>
  )
}

const PositionTrade = ({ position }: { position: PositionSummary }) => (
  <div className="flex min-w-0 items-center gap-2 text-sm">
    <span className="text-subText">Trade</span>
    <span className="truncate text-text">{position.token.symbol || 'Token'}</span>
    <span className="text-subText">•</span>
    <ShortenedId value={position.tradeId} />
  </div>
)

const PositionSellSummary = ({
  pendingSellObligations,
  pendingSellObligationsError,
  pendingSellObligationsLoading,
  position,
  preview,
  previewError,
  previewLoading,
  showClosePositionSummary,
}: Pick<
  ManagePositionFormProps,
  | 'pendingSellObligations'
  | 'pendingSellObligationsError'
  | 'pendingSellObligationsLoading'
  | 'position'
  | 'preview'
  | 'previewError'
  | 'previewLoading'
  | 'showClosePositionSummary'
>) => {
  const token: PreparedToken = {
    decimals: position.token.decimals,
    logoUrl: position.token.iconUrl,
    symbol: position.token.symbol,
  }
  const remainingAmount = withMetricFallback(formatPreparedAmount(position.displayBaseRaw, token))
  const remainingValue = formatApproximateUsd(position.valueUsd)
  const remaining = (
    <>
      {remainingAmount} <span className="text-subText">{remainingValue}</span>
    </>
  )

  const sellAmount = withMetricFallback(
    formatPreparedAmount(preview?.sellBase, getPreparedBaseToken(position, preview?.baseToken)),
  )
  const sellRatio = formatWadPercent(preview?.sellRatioRaw)
  const estimatedOutput = formatPreparedAmount(preview?.swapQuote?.expectedQuote, preview?.quoteToken)

  const skippedActionSkeletonCount = Math.max(1, Number(position.metrics.skippedSellCount?.value) || 0)
  const noPendingSellActions =
    !pendingSellObligationsLoading && !pendingSellObligationsError && pendingSellObligations?.length === 0

  return (
    <Stack className="gap-3">
      <Stack className="gap-2 rounded-xl bg-white-04 p-4">
        <PositionTrade position={position} />
        {showClosePositionSummary ? (
          <span className="text-sm font-medium text-text">Stopped Copy Position</span>
        ) : (
          <Stack className="gap-2">
            <span className="text-sm font-medium text-text">Skipped Actions:</span>
            <Stack as="ul" className="list-disc gap-2 pl-4 text-sm text-subText">
              {noPendingSellActions && <li>No skipped sell actions.</li>}
              {pendingSellObligationsLoading &&
                Array.from({ length: skippedActionSkeletonCount }, (_, index) => (
                  <li key={index}>
                    <div className="flex items-center gap-2">
                      <TextSkeleton width={112} size="sm" />
                      <TextSkeleton width={80} size="sm" />
                    </div>
                  </li>
                ))}
              {pendingSellObligations?.map((obligation, index) => (
                <li key={obligation.leaderPositionEventId || index}>
                  {formatDateTime(obligation.skippedAt)}
                  {' · '}
                  <span className="text-primary">
                    {withMetricFallback(formatWadPercent(obligation.currentRatioRaw))} sell
                  </span>
                  {' · ' + (obligation.publicErrorMessage || formatSkipReason(obligation.publicErrorCode))}
                </li>
              ))}
            </Stack>
            {pendingSellObligationsError && (
              <p className="text-sm text-red" role="alert">
                Unable to load skipped sell actions.
              </p>
            )}
          </Stack>
        )}
        <ReviewRow label="Remaining" value={remaining} />
      </Stack>

      <ReviewSection>
        <ReviewRow
          isLoading={previewLoading}
          label="Sell Amount"
          value={
            <span className="flex min-w-0 items-center justify-end gap-2">
              <span className="truncate" title={sellAmount}>
                {sellAmount}
              </span>
              {sellRatio !== '—' && (
                <span className="shrink-0 rounded bg-primary-12 px-1.5 py-0.5 text-xs text-primary">{sellRatio}</span>
              )}
            </span>
          }
        />
        <ReviewRow
          isLoading={previewLoading}
          label="Estimated Output"
          value={estimatedOutput === '—' ? withMetricFallback(estimatedOutput) : `~${estimatedOutput}`}
        />
        <ReviewRow
          isLoading={previewLoading}
          label="Cashback"
          value={withApproximateMetricFallback(formatPreparedAmount(preview?.cashback, preview?.quoteToken))}
        />
        {previewError && (
          <p className="text-sm text-red" role="alert">
            {previewError}
          </p>
        )}
      </ReviewSection>
    </Stack>
  )
}

export const ManagePositionForm = ({
  isPreparing,
  onCancel,
  onPrimaryAction,
  onSlippageChange,
  position,
  preview,
  previewError,
  previewLoading,
  pendingSellObligations,
  pendingSellObligationsError,
  pendingSellObligationsLoading,
  primaryActionDisabled,
  primaryActionLabel,
  primaryActionLoading,
  showClosePositionSummary,
  slippage,
  unavailableMessage,
}: ManagePositionFormProps) => (
  <Stack className="gap-4">
    <PositionSellSummary
      pendingSellObligations={pendingSellObligations}
      pendingSellObligationsError={pendingSellObligationsError}
      pendingSellObligationsLoading={pendingSellObligationsLoading}
      position={position}
      preview={preview}
      previewError={previewError}
      previewLoading={previewLoading}
      showClosePositionSummary={showClosePositionSummary}
    />

    <PreparedActionSlippageControl disabled={isPreparing} onChange={onSlippageChange} value={slippage} />

    <PreparedActionFormActions
      cancelDisabled={isPreparing}
      onCancel={onCancel}
      onPrimaryAction={onPrimaryAction}
      primaryActionDisabled={primaryActionDisabled}
      primaryActionLabel={primaryActionLabel}
      primaryActionLoading={primaryActionLoading}
      primaryActionTitle={unavailableMessage}
    />
  </Stack>
)
