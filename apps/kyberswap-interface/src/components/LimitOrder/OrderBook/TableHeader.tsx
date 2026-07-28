import { Trans } from '@lingui/macro'
import { HTMLAttributes } from 'react'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export const RowWrapper = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_64px] gap-x-4 gap-y-1 text-sm max-sm:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)_56px]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const TableHeader = () => {
  return (
    <RowWrapper className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase text-subText">
      <span className="w-full max-sm:col-start-1 max-sm:row-start-1">
        <Trans>Size</Trans>
      </span>
      <span className="flex w-full gap-1 max-sm:col-start-2 max-sm:row-start-1">
        <Trans>Available</Trans>
        <InfoHelper margin={false} size={14} text={<Trans>Amount available to be filled.</Trans>} />
      </span>
      <span className="w-full max-sm:col-start-2 max-sm:row-start-2">
        <Trans>Rate</Trans>
      </span>
      <span className="w-full max-sm:col-start-1 max-sm:row-start-2">
        <Trans>Total</Trans>
      </span>
      <span className="max-sm:hidden">
        <Trans>Action</Trans>
      </span>
    </RowWrapper>
  )
}

export default TableHeader
