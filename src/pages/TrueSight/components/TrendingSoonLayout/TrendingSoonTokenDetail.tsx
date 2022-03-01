import React, { useRef, useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import { ButtonPrimary } from 'components/Button'
import { ChevronDown } from 'react-feather'
import useTheme from 'hooks/useTheme'
import Divider from 'components/Divider'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import SwapButtonWithOptions from 'pages/TrueSight/components/TrendingSoonLayout/SwapButtonWithOptions'
import { rgba } from 'polished'
import CopyHelper from 'components/Copy'
import AddTokenToMetaMask from 'components/AddToMetamask'

const TrendingSoonTokenDetail = () => {
  return <TrendingSoonTokenDesktop />
}

const TrendingSoonTokenDesktop = () => {
  const theme = useTheme()

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
          <WebsiteCommunityAddressButton>Website ↗</WebsiteCommunityAddressButton>
          <WebsiteCommunityAddressButton>
            <div>
              <Trans>Community</Trans>
            </div>
            <ChevronDown size="16px" />
          </WebsiteCommunityAddressButton>
          <WebsiteCommunityAddressButton>
            <CurrencyLogo currency={ETHER} size="16px" />
            <div>0x394...5e3</div>
            <CopyHelper toCopy="0x394...5e3" margin="0" />
            <AddTokenToMetaMask token={WETH[ChainId.MAINNET]} chainId={ChainId.MAINNET} />
            <ChevronDown size="16px" cursor="pointer" />
          </WebsiteCommunityAddressButton>
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
`

const TagContainer = styled(Flex)`
  align-items: center;
  gap: 4px;
`

const WebsiteCommunityAddressContainer = styled(Flex)`
  align-items: center;
  gap: 8px;
`

const WebsiteCommunityAddressButton = styled(Flex)`
  align-items: center;
  padding: 7px 12px;
  gap: 4px;
  width: fit-content;
  font-size: 12px;
  line-height: 14px;
  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
`

export default TrendingSoonTokenDetail
