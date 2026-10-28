import { Trans } from '@lingui/macro'
import { HTMLAttributes, ReactNode } from 'react'

import { cn } from 'utils/cn'

export enum StopMarketRowLayout {
  ACTIVE = 'active',
  HISTORY = 'history',
}

type RowWrapperProps = {
  children: ReactNode
  className?: string
  layout?: StopMarketRowLayout
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>

/**
 * Owns the column template for both the header and every data row, so they can never drift apart.
 * Mobile keeps the chain, the pair, one number and the action, matching how the limit-order table sheds
 * columns.
 */
export const StopMarketRowWrapper = ({
  children,
  className,
  layout = StopMarketRowLayout.ACTIVE,
  ...rest
}: RowWrapperProps) => (
  <div
    {...rest}
    className={cn(
      'grid items-center gap-x-3 gap-y-1 text-sm max-sm:gap-x-2 max-sm:px-3',
      // An open order has two actions, edit and cancel; a closed one has one.
      layout === StopMarketRowLayout.ACTIVE
        ? 'grid-cols-[44px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_60px] max-sm:grid-cols-[20px_minmax(0,1.1fr)_minmax(0,0.8fr)_60px]'
        : 'grid-cols-[44px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,0.8fr)_28px] max-sm:grid-cols-[20px_minmax(0,1.1fr)_minmax(0,0.8fr)_28px]',
      className,
    )}
  >
    {children}
  </div>
)

const StopMarketTableHeader = ({ isActiveTab }: { isActiveTab?: boolean }) => (
  <StopMarketRowWrapper
    layout={isActiveTab ? StopMarketRowLayout.ACTIVE : StopMarketRowLayout.HISTORY}
    data-testid="stop-market-table-header"
    className="cursor-default bg-raisedBlack px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-gray"
  >
    {/* The logos alone identify the chain on a phone, where the label would not fit the column. */}
    <span className="max-sm:invisible">
      <Trans>Chain</Trans>
    </span>
    <span>
      <Trans>Pair</Trans>
    </span>
    <span className="max-sm:col-start-3 max-sm:justify-self-end max-sm:text-right">
      <Trans>Sell Amount</Trans>
    </span>
    <span className="flex flex-col gap-0.5 max-sm:hidden">
      <span>
        <Trans>Trigger Price</Trans>
      </span>
      <span>
        <Trans>Slippage</Trans>
      </span>
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
  </StopMarketRowWrapper>
)

export default StopMarketTableHeader
