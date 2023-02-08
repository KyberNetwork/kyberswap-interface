import { Trans } from '@lingui/macro'
import { transparentize } from 'polished'
import React from 'react'
import { AlertTriangle } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween, RowFixed } from 'components/Row'

const Wrapper = styled(AutoColumn)`
  background-color: ${({ theme }) => transparentize(0.9, theme.primary)};
  color: ${({ theme }) => theme.primary};
  padding: 0.5rem;
  border-radius: 12px;
`

type Props = {
  level: 0 | 1 | 2
  onAcceptChange: () => void
}
const AcceptChangesNotice: React.FC<Props> = ({ level, onAcceptChange }) => {
  return (
    <Wrapper justify="flex-start" gap={'0px'}>
      <RowBetween>
        <RowFixed>
          <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
          <Text as="span" fontWeight={'500'}>
            <Trans>Price Updated</Trans>
          </Text>
        </RowFixed>
        <ButtonPrimary
          style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
          onClick={onAcceptChange}
        >
          <Trans>Accept</Trans>
        </ButtonPrimary>
      </RowBetween>
    </Wrapper>
  )
}

export default AcceptChangesNotice
