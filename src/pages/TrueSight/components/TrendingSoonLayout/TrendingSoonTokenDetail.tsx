import React from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { ChainId, ETHER, WETH } from '@dynamic-amm/sdk'
import { Trans } from '@lingui/macro'

import CurrencyLogo from 'components/CurrencyLogo'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import useTheme from 'hooks/useTheme'
import Divider from 'components/Divider'
import SwapButtonWithOptions from 'pages/TrueSight/components/TrendingSoonLayout/SwapButtonWithOptions'
import { rgba } from 'polished'
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

      <TokenStatisticsContainer>
        <TokenStatisticsFieldName style={{ textAlign: 'left' }}>
          <Trans>Trading Volume</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>24h</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Market Cap</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Holders</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsFieldName>
          <Trans>Price</Trans>
        </TokenStatisticsFieldName>
        <TokenStatisticsValue style={{ textAlign: 'left' }}>$21,532,441,584</TokenStatisticsValue>
        <Flex justifyContent="flex-end" alignItems="center" style={{ gap: '4px' }}>
          <ChevronDown size="16px" color={theme.apr} />
          <TokenStatisticsValue style={{ color: theme.apr, fontWeight: 500 }}>1,232%</TokenStatisticsValue>
        </Flex>
        <TokenStatisticsValue>$807,381,607,897</TokenStatisticsValue>
        <TokenStatisticsValue>200,000,000</TokenStatisticsValue>
        <TokenStatisticsValue>$0.000000004234</TokenStatisticsValue>
      </TokenStatisticsContainer>
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

const TokenStatisticsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 0.5fr 1fr 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 4px;
`

const TokenStatisticsFieldName = styled(Text)`
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  text-align: right;
`

const TokenStatisticsValue = styled(Text)`
  font-weight: 400;
  font-size: 14px;
  color: ${({ theme }) => theme.text};
  text-align: right;
`

export default TrendingSoonTokenDetail
