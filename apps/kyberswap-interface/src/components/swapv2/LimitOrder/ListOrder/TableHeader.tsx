import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import { ItemWrapper } from 'components/swapv2/LimitOrder/ListOrder/OrderItem'
import { MEDIA_WIDTHS } from 'theme'

const TableHeader = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <ItemWrapper
      className="border-b-0 bg-tableHeader px-3 py-4 text-xs font-medium text-subText max-sm:pl-4"
      hasBorder={false}
    >
      {!upToSmall ? (
        <>
          <div className="flex items-center gap-2.5">
            <span>
              <Trans>LIMIT ORDER(S)</Trans>
            </span>
          </div>
          <span className="rate">
            <Trans>RATE</Trans>
          </span>
          <span>
            <Trans>CREATED | EXPIRY</Trans>
          </span>
          <span>
            <Trans> FILLED % | STATUS</Trans>
          </span>
          <span className="text-right">
            <Trans>ACTION</Trans>
          </span>
        </>
      ) : (
        <span className="whitespace-nowrap">
          <Trans>LIMIT ORDER(S)</Trans>
        </span>
      )}
    </ItemWrapper>
  )
}

export default TableHeader
