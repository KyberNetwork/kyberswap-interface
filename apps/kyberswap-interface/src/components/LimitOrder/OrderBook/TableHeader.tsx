import { Trans } from '@lingui/macro'
import { HTMLAttributes } from 'react'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export const RowWrapper = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[44px_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_48px_88px] items-center gap-x-4 gap-y-1 text-sm max-sm:grid-cols-[48px_minmax(0,1fr)_minmax(0,0.8fr)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const TableHeader = () => {
  return (
    <RowWrapper className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText">
      <span className="max-sm:row-span-2 max-sm:self-center">
        <Trans>Chain</Trans>
      </span>
      <span className="justify-self-center text-center max-sm:justify-self-start max-sm:text-left">
        <Trans>Size</Trans>
      </span>
      <span className="flex gap-1 justify-self-end text-right max-sm:col-start-3 max-sm:row-start-2">
        <Trans>Available</Trans>
        <InfoHelper margin={false} size={14} text={<Trans>Amount available to be filled.</Trans>} />
      </span>
      <span className="justify-self-end text-right max-sm:col-start-3 max-sm:row-start-1">
        <Trans>Rate</Trans>
      </span>
      <span className="justify-self-end text-right max-sm:col-start-2 max-sm:row-start-2 max-sm:justify-self-start max-sm:text-left">
        <Trans>Total</Trans>
      </span>
      <span className="justify-self-end text-right max-sm:hidden">
        <Trans>ID</Trans>
      </span>
      <span className="justify-self-end text-right max-sm:hidden">
        <Trans>Action</Trans>
      </span>
    </RowWrapper>
  )
}

export default TableHeader
