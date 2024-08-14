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
  :hover {
    background-color: ${({ theme }) => rgba(theme.primary, 0.2)};
  }
`

export default function TableHeader() {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  const { currencyIn, currencyOut } = useLimitState()

  return (
    <Header>
      <Text>
        <span>{currencyIn?.symbol || ''}/</span>
        {upToSmall ? <br /> : ''}
        <span>{currencyOut?.symbol || ''}</span>
      </Text>
      <Text>
        <Trans>AMOUNT</Trans>
        {upToSmall ? <br /> : ' '}
        <Trans>({currencyIn?.symbol})</Trans>
      </Text>
      <Text>
        <Trans>AMOUNT</Trans>
        {upToSmall ? <br /> : ' '}
        <Trans>({currencyOut?.symbol})</Trans>
      </Text>
      <Text>
        <Trans>ORDER STATUS</Trans>
      </Text>
    </Header>
  )
}
