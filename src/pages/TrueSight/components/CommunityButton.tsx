import React, { useRef, useState } from 'react'
import { Text } from 'rebass'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { StyledAddressButton } from 'pages/TrueSight/components/AddressButton'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

const CommunityButton = () => {
  const [isShowOptions, setIsShowOptions] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleShowOptions = () => setIsShowOptions(prev => !prev)

  const theme = useTheme()

  useOnClickOutside(containerRef, () => setIsShowOptions(false))

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <WebsiteCommunityButton onClick={toggleShowOptions}>
        <div>
          <Trans>Community</Trans>
        </div>
        <ChevronDown size="16px" />
      </WebsiteCommunityButton>
      {isShowOptions && (
        <OptionsContainer>
          <Text
            fontSize="12px"
            lineHeight="14px"
            fontWeight={400}
            color={theme.subText}
            as={ExternalLink}
            href="https://www.google.com"
            target="_blank"
          >
            Telegram ↗
          </Text>
          <Text
            fontSize="12px"
            lineHeight="14px"
            fontWeight={400}
            color={theme.subText}
            as={ExternalLink}
            href="https://www.google.com"
            target="_blank"
          >
            Facebook ↗
          </Text>
        </OptionsContainer>
      )}
    </div>
  )
}

export default CommunityButton

export const WebsiteCommunityButton = styled(StyledAddressButton)`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`
