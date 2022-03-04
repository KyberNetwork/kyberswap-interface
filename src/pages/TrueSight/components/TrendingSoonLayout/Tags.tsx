import React from 'react'
import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { rgba } from 'polished'

const Tags = () => {
  return (
    <TagContainer>
      <Tag>
        <Trans>Payments</Trans>
      </Tag>
      <Tag>
        <Trans>Stable Coin</Trans>
      </Tag>
      <Tag>
        <Trans>Things</Trans>
      </Tag>
    </TagContainer>
  )
}

export default Tags

const Tag = styled(Text)`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  padding: 5px 8px;
  border-radius: 24px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => rgba(theme.subText, 0.1)};
  }
`

const TagContainer = styled(Flex)`
  align-items: center;
  gap: 4px;
`
