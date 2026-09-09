import { type ReactNode } from 'react'
import { isValuationRenderable, metricValue } from 'services/copyTrading/adapters/shared'
import type { CopyRunListItem } from 'services/copyTrading/types/copyRuns'

import { ErrorWarning } from 'components/ErrorWarning'
import Skeleton from 'components/Skeleton'
import { Stack } from 'components/Stack'
import {
  canAttemptPreparation,
  formatTokenAmount,
  formatUsd,
  getPreparedReasonMessage,
} from 'pages/CopyTrading/helpers'
import { ReviewRow, ReviewSection } from 'pages/CopyTrading/modals/PreparedActionModal'
import { formatPreparedAmount, withMetricFallback } from 'pages/CopyTrading/modals/PreparedActionModal/preparedAction'
import { shortenAddress } from 'utils/address'
import { cn } from 'utils/cn'

import { WithdrawQuoteInput } from './components'
import type { useWithdrawQuote } from './useWithdrawQuote'
import type { WithdrawalInventory, useWithdrawalPreview } from './useWithdrawalData'

const tokenRowClassName =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 px-3 py-2 text-sm font-medium sm:grid-cols-[minmax(60px,1fr)_140px_120px] sm:gap-2'
const tokenAmountClassName =
  'col-start-1 row-start-2 min-w-0 truncate text-subText sm:col-auto sm:row-auto sm:text-right'
const tokenValueClassName = 'col-start-2 row-start-1 min-w-0 truncate text-right sm:col-auto sm:row-auto'
const tokenLabel = (symbol?: string, address?: string) =>
  symbol && !/^0x[0-9a-f]{40}$/i.test(symbol)
    ? symbol
    : address || symbol
    ? shortenAddress(1, address || symbol || '', 4, false)
    : 'Unknown token'

export type WithdrawalMode = 'all' | 'stable'
const WithdrawalCollapse = ({ expanded, children }: { expanded: boolean; children: ReactNode }) => (
  <div
    aria-hidden={!expanded}
    inert={!expanded}
    className={cn(
      'grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none',
      expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
    )}
  >
    <div className="min-h-0 overflow-hidden">{children}</div>
  </div>
)

export const WithdrawalOptions = ({
  mode,
  changeMode,
  disabled,
  copyRun,
  wallet,
  quote,
  display,
}: {
  mode: WithdrawalMode
  changeMode: (mode: WithdrawalMode) => void
  disabled: boolean
  copyRun: CopyRunListItem
  wallet: WithdrawalInventory
  quote: Pick<ReturnType<typeof useWithdrawQuote>, 'input' | 'selectedValueUsd'>
  display: ReturnType<typeof useWithdrawalPreview>
}) => {
  const { inventory, stable, loading: isInventoryLoading } = wallet
  const preview = display.preview
  const walletAssets = [
    ...(stable ? [stable] : []),
    ...(inventory?.data || []).filter(row => row.tokenAddress.toLowerCase() !== stable?.tokenAddress.toLowerCase()),
  ]
  const assets =
    preview?.tokens !== undefined
      ? preview.tokens.map(asset => ({
          address: asset.token?.address,
          symbol: asset.token?.symbol,
          amount: withMetricFallback(formatPreparedAmount(asset.balance, asset.token)),
          valueUsd: isValuationRenderable(asset.currentValuation) ? asset.currentValuation?.valueUsd : undefined,
        }))
      : walletAssets.map(asset => ({
          address: asset.tokenAddress,
          symbol: asset.token?.symbol,
          amount: `${formatTokenAmount(asset.amountDecimal)}${asset.token?.symbol ? ` ${asset.token.symbol}` : ''}`,
          valueUsd: asset.valueUsd,
        }))
  const total = metricValue(preview?.totalCurrentValueUsd)
  const rebates = metricValue(preview?.cashbackForfeitedUsd)
  return (
    <Stack className="gap-4">
      <Stack className="gap-4">
        <p className="text-sm text-subText">Withdraw directly to your wallet.</p>
        <Stack role="radiogroup" aria-label="Withdrawal option" className="gap-3">
          {(['all', 'stable'] as const).map(option => {
            const availability =
              option === 'all' ? copyRun.withdrawTokensAvailability : copyRun.withdrawQuoteAvailability
            const available = canAttemptPreparation(availability)
            return (
              <Stack key={option} className="gap-0 rounded-xl bg-white-04">
                <label
                  className={cn(
                    'flex items-center gap-2 p-3 text-sm transition-colors duration-150',
                    mode === option ? 'rounded-t-xl' : 'rounded-xl',
                    disabled || !available ? 'cursor-not-allowed text-subText' : 'cursor-pointer hover:bg-white-04',
                  )}
                >
                  <input
                    type="radio"
                    name="withdrawal-mode"
                    value={option}
                    checked={mode === option}
                    disabled={disabled || !available}
                    onChange={() => changeMode(option)}
                    className="size-4 accent-primary"
                  />
                  <span className="flex-1">{option === 'all' ? 'All Tokens' : 'Withdraw Stable only'}</span>
                  <span className="font-medium">
                    {(option === 'all' ? display.loading && !preview : isInventoryLoading && !inventory) ? (
                      <Skeleton width={72} height={16} variant="darkSubtle" />
                    ) : (
                      formatUsd(option === 'all' ? total : stable?.valueUsd)
                    )}
                  </span>
                </label>
                {!available && (
                  <p className="px-3 pb-3 text-xs text-warning">{getPreparedReasonMessage(availability?.reason)}</p>
                )}
                <WithdrawalCollapse expanded={mode === option}>
                  <div className={option === 'stable' ? 'border-t border-border p-3' : 'pb-3'}>
                    {option === 'stable' ? (
                      <WithdrawQuoteInput {...quote.input} />
                    ) : (
                      <Stack className="max-h-52 gap-0 overflow-y-auto border-t border-border pt-1">
                        {assets.map(asset => (
                          <div key={asset.address} className={tokenRowClassName}>
                            <span className="min-w-0 truncate" title={asset.address}>
                              {tokenLabel(asset.symbol, asset.address)}
                            </span>
                            <span className={tokenAmountClassName}>{asset.amount}</span>
                            <span className={tokenValueClassName}>{formatUsd(asset.valueUsd)}</span>
                          </div>
                        ))}
                        {!assets.length && !display.loading && (
                          <span className="text-subText">Token preview unavailable</span>
                        )}
                      </Stack>
                    )}
                  </div>
                </WithdrawalCollapse>
              </Stack>
            )
          })}
        </Stack>
        <ReviewSection>
          <ReviewRow
            label="Est. USD from selected"
            isLoading={mode === 'all' && display.loading && !preview}
            value={formatUsd(mode === 'all' ? total : quote.selectedValueUsd)}
          />
          <ReviewRow
            label="Cash-back forfeited"
            isLoading={mode === 'all' && display.loading && !preview}
            value={mode === 'stable' ? '$0' : formatUsd(rebates)}
          />
          <ReviewRow
            label="Gas fee"
            isLoading={mode === 'all' && !display.gas && (display.loading || display.gasLoading === true)}
            value={mode === 'all' ? display.gas || 'N/A' : 'Estimated in wallet'}
          />
        </ReviewSection>
      </Stack>
      <div>
        <WithdrawalCollapse expanded={mode === 'all'}>
          <ErrorWarning
            type="info"
            className="bg-blue/10 text-blue [&>div]:text-blue"
            title={
              <>
                No cashback applies when withdrawing non-stable tokens.
                <br />
                Stable token withdrawal has no cashback impact.
              </>
            }
          />
        </WithdrawalCollapse>
        <WithdrawalCollapse expanded={mode === 'stable'}>
          <ErrorWarning
            type="info"
            className="bg-blue/10 text-blue [&>div]:text-blue"
            title="Withdraw stable tokens without selling positions or changing the copy pause state."
          />
        </WithdrawalCollapse>
      </div>
    </Stack>
  )
}
