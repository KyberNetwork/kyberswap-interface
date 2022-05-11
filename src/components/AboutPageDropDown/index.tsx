import React, { useState } from 'react'

import { StyledNavLink } from 'components/Header'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import useTheme from 'hooks/useTheme'
import styled from 'styled-components'
import { Flex } from 'rebass'
import { isMobile } from 'react-device-detect'

export const LinkCointainer = styled(Flex)`
  position: absolute;
  bottom: -100px;
  left: 0;
  border-radius: 8px;
  flex-direction: column;
  background: ${({ theme }) => theme.tableHeader};
  z-index: 9999;
  padding: 16px;
  gap: 16px;
`

export default function AboutPageDropwdown({}) {
  const [isShowOptions, setIsShowOptions] = useState(false)

  const handleClick = (e: any) => {
    e.preventDefault()
    setIsShowOptions(prev => !prev)
  }

  return (
    <StyledNavLink
      id={`about`}
      to={'/about'}
      isActive={match => Boolean(match)}
      style={{ position: 'relative' }}
      onClick={handleClick}
    >
      <Trans>About</Trans>
      <ChevronDown size={16} style={{ marginLeft: '6px' }} />
      {isShowOptions && !isMobile && (
        <LinkCointainer>
          <StyledNavLink id={`about-kyberswap`} to={'/about/kyberswap'} isActive={match => Boolean(match)}>
            <Trans>KyberSwap</Trans>
          </StyledNavLink>

          <StyledNavLink id={`about-knc`} to={'/about/knc'} isActive={match => Boolean(match)}>
            <Trans> KNC</Trans>
          </StyledNavLink>
        </LinkCointainer>
      )}
    </StyledNavLink>
  )
}
