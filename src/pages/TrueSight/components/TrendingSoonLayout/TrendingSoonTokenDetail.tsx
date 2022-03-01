import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import { ButtonPrimary } from 'components/Button'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import useTheme from 'hooks/useTheme'
import Divider from 'components/Divider'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import SwapButtonWithOptions from 'pages/TrueSight/components/TrendingSoonLayout/SwapButtonWithOptions'
import { rgba } from 'polished'
import CopyHelper from 'components/Copy'
import AddTokenToMetaMask from 'components/AddToMetamask'
import useCopyClipboard from 'hooks/useCopyClipboard'

const TrendingSoonTokenDetail = () => {
  return <TrendingSoonTokenDesktop />
}

const TrendingSoonTokenDesktop = () => {
  const theme = useTheme()
  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied('123')
  }

  return (
    <Flex flexDirection="column" style={{ gap: '24px' }}>
      <LogoNameSwapContainer>
        <LogoNameContainer>
          <CurrencyLogo currency={ETHER} size="36px" />
          <Text fontWeight={500} style={{ textTransform: 'uppercase' }}>
            Baby Floki Billionaire
          </Text>
        </LogoNameContainer>
        <SwapButtonWithOptions />
      </LogoNameSwapContainer>

      <TagWebsiteCommunityAddressContainer>
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
        <WebsiteCommunityAddressContainer>
          <WebsiteCommunityButton>Website ↗</WebsiteCommunityButton>
          <WebsiteCommunityButton>
            <div>
              <Trans>Community</Trans>
            </div>
            <ChevronDown size="16px" />
          </WebsiteCommunityButton>
          <AddressButton>
            <CurrencyLogo currency={ETHER} size="16px" />
            <AddressCopyContainer onClick={onCopy}>
              <div>0x394...5e3</div>
              {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
            </AddressCopyContainer>
            <AddTokenToMetaMask token={WETH[ChainId.MAINNET]} chainId={ChainId.MAINNET} />
            <ChevronDownWrapper>
              <ChevronDown size="16px" cursor="pointer" />
            </ChevronDownWrapper>
          </AddressButton>
        </WebsiteCommunityAddressContainer>
      </TagWebsiteCommunityAddressContainer>

      <Divider />
    </Flex>
  )
}

const LogoNameSwapContainer = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`

const LogoNameContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const TagWebsiteCommunityAddressContainer = styled(Flex)`
  justify-content: space-between;
  align-items: center;
`

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

const WebsiteCommunityAddressContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const AddressButton = styled(Flex)`
  align-items: center;
  padding: 7px 12px;
  gap: 4px;
  width: fit-content;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  cursor: pointer;
`

const WebsiteCommunityButton = styled(AddressButton)`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

const AddressCopyContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

const ChevronDownWrapper = styled.div`
  &:hover {
    color: ${({ theme }) => theme.disableText};
  }
`

export default TrendingSoonTokenDetail
