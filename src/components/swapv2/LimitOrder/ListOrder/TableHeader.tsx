import { Trans } from '@lingui/macro'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { MEDIA_WIDTHS } from 'theme'

import { ItemWrapper } from './OrderItem'

const Header = styled(ItemWrapper)`
  background-color: ${({ theme }) => theme.tableHeader};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
  padding: 16px 12px;
  border-bottom: none;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding-left: 16px;
  `};
`

const TableHeader = () => {
  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)
  return (
    <Header>
      {!upToSmall ? (
        <>
          <Flex alignItems={'center'} style={{ gap: 10 }}>
            <Text>
              <Trans>LIMIT ORDER(S)</Trans>
            </Text>
          </Flex>
          <Text className="rate">
            <Trans>RATE</Trans>
          </Text>
          <Text>
            <Trans>CREATED | EXPIRY</Trans>
          </Text>
          <Text>
            <Trans> FILLED % | STATUS</Trans>
          </Text>
          <Text textAlign={'right'}>
            <Trans>ACTION</Trans>
          </Text>
        </>
      ) : (
        <Text style={{ whiteSpace: 'nowrap' }}>
          <Trans>LIMIT ORDER(S)</Trans>
        </Text>
      )}
    </Header>
  )
}

export default TableHeader
