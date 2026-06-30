import { Trans } from '@lingui/macro'
import { HTMLAttributes } from 'react'

import InfoHelper from 'components/InfoHelper'
import { cn } from 'utils/cn'

export const RowWrapper = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.25fr)_minmax(0,1.4fr)_128px_60px] items-center gap-2 text-sm max-[640px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1.45fr)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const TableHeader = () => (
  <RowWrapper className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText">
    <span>
      <Trans>Chain</Trans>
    </span>
    <span className="justify-self-end text-right">
      <Trans>Size</Trans>
    </span>
    <span className="flex gap-1 justify-self-end text-right max-[640px]:hidden">
      <Trans>Available</Trans>
      <InfoHelper margin={false} placement="top" size={14} text={<Trans>Available amount to be filled.</Trans>} />
    </span>
    <span className="justify-self-end text-right">
      <Trans>Rate</Trans>
    </span>
    <span className="justify-self-end text-right">
      <Trans>Total</Trans>
    </span>
    <span className="justify-self-end text-right max-[640px]:hidden">
      <Trans>Status</Trans>
    </span>
    <span className="justify-self-end text-right max-[640px]:hidden" />
  </RowWrapper>
)

export default TableHeader
