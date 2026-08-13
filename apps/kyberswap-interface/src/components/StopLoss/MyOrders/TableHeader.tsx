import { Trans } from '@lingui/macro'
import { HTMLAttributes, ReactNode } from 'react'

import { cn } from 'utils/cn'

export enum StopLossRowLayout {
  ACTIVE = 'active',
  HISTORY = 'history',
}

type RowWrapperProps = {
  children: ReactNode
  className?: string
  layout?: StopLossRowLayout
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>

/**
 * Owns the column template for both the header and every data row, so they can never drift apart.
 * Mobile keeps the pair, one number and the action, matching how the limit-order table sheds columns.
 */
export const StopLossRowWrapper = ({
  children,
  className,
  layout = StopLossRowLayout.ACTIVE,
  ...rest
}: RowWrapperProps) => (
  <div
    {...rest}
    className={cn(
      'grid items-center gap-x-4 gap-y-1 text-sm max-sm:gap-x-2 max-sm:px-3',
      layout === StopLossRowLayout.ACTIVE
        ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_44px]'
        : 'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_44px]',
      'max-sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)_28px]',
      className,
    )}
  >
    {children}
  </div>
)

const StopLossTableHeader = ({ isActiveTab }: { isActiveTab?: boolean }) => (
  <StopLossRowWrapper
    layout={isActiveTab ? StopLossRowLayout.ACTIVE : StopLossRowLayout.HISTORY}
    data-testid="stop-loss-table-header"
    className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText"
  >
    <span>
      <Trans>Pair</Trans>
    </span>
    <span className="max-sm:col-start-2 max-sm:justify-self-end max-sm:text-right">
      <Trans>Sell Amount</Trans>
    </span>
    <span className="max-sm:hidden">
      <Trans>Trigger Price</Trans>
    </span>
    {isActiveTab ? (
      <>
        <span className="max-sm:hidden">
          <Trans>Current Price</Trans>
        </span>
        <span className="max-sm:hidden">
          <Trans>Distance</Trans>
        </span>
        <span className="max-sm:hidden">
          <Trans>Expires</Trans>
        </span>
      </>
    ) : (
      <>
        <span className="max-sm:hidden">
          <Trans>Execution Price</Trans>
        </span>
        <span className="max-sm:hidden">
          <Trans>Received</Trans>
        </span>
        <span className="max-sm:hidden">
          <Trans>Status</Trans>
        </span>
      </>
    )}
    <span className="max-sm:hidden" />
  </StopLossRowWrapper>
)

export default StopLossTableHeader
