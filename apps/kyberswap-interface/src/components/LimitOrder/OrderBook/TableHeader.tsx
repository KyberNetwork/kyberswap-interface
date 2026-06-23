import { Trans } from '@lingui/macro'
import { HTMLAttributes } from 'react'
import { useMedia } from 'react-use'

import InfoHelper from 'components/InfoHelper'
import { MEDIA_WIDTHS } from 'theme'
import { cn } from 'utils/cn'

export const RowWrapper = ({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'grid grid-cols-[44px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.45fr)_minmax(0,1.2fr)_48px_88px] items-center gap-2 text-sm max-[640px]:grid-cols-[40px_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.35fr)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

const TableHeader = () => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <RowWrapper className="cursor-default bg-background px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText">
      <span>CHAIN</span>
      <span className="justify-self-end text-right">
        <Trans>Size</Trans>
      </span>
      {!upToExtraSmall && (
        <span className="flex gap-1 justify-self-end text-right">
          <Trans>Available</Trans>
          <InfoHelper margin={false} size={14} text={<Trans>Amount available to be taken from the order.</Trans>} />
        </span>
      )}
      <span className="justify-self-end text-right">
        <Trans>Rate</Trans>
      </span>
      <span className="justify-self-end text-right">
        <Trans>Total</Trans>
      </span>
      {!upToExtraSmall && (
        <span className="justify-self-end text-right">
          <Trans>ID</Trans>
        </span>
      )}
      {!upToExtraSmall && (
        <span className="justify-self-end text-right">
          <Trans>Action</Trans>
        </span>
      )}
    </RowWrapper>
  )
}

export default TableHeader
