import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import InfoHelper from 'components/InfoHelper'
import { ItemWrapper } from 'components/swapv2/LimitOrder/OrderBook/OrderItem'
import { MEDIA_WIDTHS } from 'theme'

const TableHeader = () => {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)

  return (
    <ItemWrapper className="cursor-default bg-white/[0.04] px-4 py-3 text-xs font-medium uppercase tracking-[0.04em] text-subText">
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
    </ItemWrapper>
  )
}

export default TableHeader
