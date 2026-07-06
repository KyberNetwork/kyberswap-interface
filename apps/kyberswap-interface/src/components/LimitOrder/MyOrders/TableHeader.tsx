import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export enum RowWrapperLayout {
  ACTIVE = 'active',
  HISTORY = 'history',
}

type RowWrapperProps = {
  children: ReactNode
  className?: string
  layout?: RowWrapperLayout
}

export const RowWrapper = ({ children, className, layout = RowWrapperLayout.HISTORY }: RowWrapperProps) => {
  const isActiveLayout = layout === RowWrapperLayout.ACTIVE

  return (
    <div
      className={cn(
        'grid items-center gap-x-4 gap-y-1 text-sm',
        isActiveLayout
          ? 'grid-cols-[44px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_60px]'
          : 'grid-cols-[44px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_60px]',
        'max-sm:grid-cols-[48px_minmax(0,1fr)_minmax(0,0.8fr)]',
        isActiveLayout && 'max-sm:grid-cols-[48px_minmax(0,1fr)_minmax(0,0.8fr)_28px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

const TableHeader = ({ isActiveTab }: { isActiveTab?: boolean }) => (
  <RowWrapper
    layout={isActiveTab ? RowWrapperLayout.ACTIVE : RowWrapperLayout.HISTORY}
    className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText"
  >
    <span className="max-sm:row-span-2 max-sm:self-center">
      <Trans>Chain</Trans>
    </span>
    <span className="justify-self-center text-center max-sm:justify-self-start max-sm:text-left">
      <Trans>Size</Trans>
    </span>
    <span className="justify-self-end text-right max-sm:col-start-3 max-sm:row-start-1">
      <Trans>Rate</Trans>
    </span>
    {isActiveTab && (
      <span className="flex gap-1 justify-self-end text-right max-sm:col-start-3 max-sm:row-start-2 max-sm:justify-self-end max-sm:text-right">
        <Trans>Available</Trans>
        <InfoHelper margin={false} placement="top" size={14} text={<Trans>Available amount to be filled.</Trans>} />
      </span>
    )}
    <span className="justify-self-end text-right max-sm:hidden">
      <Trans>Created / Expiry</Trans>
    </span>
    <span
      className={cn(
        'justify-self-start text-left max-sm:row-start-2',
        isActiveTab
          ? 'max-sm:col-start-2 max-sm:justify-self-start max-sm:text-left'
          : 'max-sm:col-span-2 max-sm:col-start-2 max-sm:justify-self-stretch max-sm:text-left',
      )}
    >
      <Trans>Status</Trans>
    </span>
    <span className="justify-self-end text-right max-sm:hidden" />
  </RowWrapper>
)

export default TableHeader
