import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { useLimitState } from 'state/limit/hooks'
import { MEDIA_WIDTHS } from 'theme'

import { ItemWrapper } from './OrderItem'

const Header = styled(ItemWrapper)`
  background: ${({ theme }) => rgba(theme.white, 0.04)};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  padding: 16px 12px;
  cursor: default;
`

export default function TableHeader() {
  const upToExtraSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToExtraSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()

  return (
    <Header>
      <Text>CHAIN</Text>
      <Text>
        <Trans>RATE</Trans>
        {!!currencyIn && !!currencyOut && (
          <>
            {upToExtraSmall ? <br /> : ' '}(<span>{currencyIn?.symbol}/</span>
            <span>{currencyOut?.symbol}</span>)
          </>
        )}
      </Text>
      <Text>
        <Trans>AMOUNT</Trans>
        {!!currencyIn && (
          <>
            {upToExtraSmall ? <br /> : ' '}
            <span>({currencyIn?.symbol})</span>
          </>
        )}
      </Text>
      <Text>
        <Trans>AMOUNT</Trans>
        {!!currencyOut && (
          <>
            {upToExtraSmall ? <br /> : ' '}
            <span>({currencyOut?.symbol})</span>
          </>
        )}
      </Text>
      {!upToExtraSmall && (
        <Text>
          <Trans>ORDER STATUS</Trans>
        </Text>
      )}
    </Header>
  )
}
