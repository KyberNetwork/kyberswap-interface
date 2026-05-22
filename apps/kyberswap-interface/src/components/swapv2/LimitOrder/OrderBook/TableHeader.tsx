import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'

import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { ItemWrapper } from './OrderItem'

export default function TableHeader() {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()

  return (
    <ItemWrapper className="bg-white/[0.04] cursor-default p-3 text-xs font-medium leading-4 text-subText">
      <span>CHAIN</span>
      <span>
        <Trans>RATE</Trans>
        {!!currencyIn && !!currencyOut && (
          <>
            {upToExtraSmall ? <br /> : ' '}(<span>{currencyIn?.symbol}/</span>
            <span>{currencyOut?.symbol}</span>)
          </>
        )}
      </span>
      <span>
        <Trans>AMOUNT</Trans>
        {!!currencyIn && (
          <>
            {upToExtraSmall ? <br /> : ' '}
            <span>({currencyIn?.symbol})</span>
          </>
        )}
      </span>
      <span>
        <Trans>AMOUNT</Trans>
        {!!currencyOut && (
          <>
            {upToExtraSmall ? <br /> : ' '}
            <span>({currencyOut?.symbol})</span>
          </>
        )}
      </span>
      {!upToExtraSmall && (
        <span>
          <Trans>ORDER STATUS</Trans>
        </span>
      )}
    </ItemWrapper>
  )
}
